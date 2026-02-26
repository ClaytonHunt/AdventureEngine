import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const budgetsPath = path.join(repoRoot, '.pi', 'chronicle', 'perf-budgets.json');
const outDir = path.join(repoRoot, '.pi', 'chronicle', 'artifacts', 'tmp', 'perf');

function now() {
  return new Date().toISOString();
}

function fail(message) {
  console.error(`PERF_BUDGET_FAIL: ${message}`);
  process.exit(1);
}

function resolvePnpmCommand() {
  if (process.env.PNPM_BIN?.trim()) {
    return { command: process.env.PNPM_BIN.trim(), preArgs: [] };
  }

  if (process.platform === 'win32') {
    return { command: 'cmd.exe', preArgs: ['/d', '/s', '/c', 'pnpm'] };
  }

  return { command: 'pnpm', preArgs: [] };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function p90(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.ceil(sorted.length * 0.9) - 1);
  return sorted[idx];
}

function stdDev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, n) => acc + (n - mean) ** 2, 0) / values.length;
  return Math.round(Math.sqrt(variance));
}

async function runCommand(command, args, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const started = process.hrtime.bigint();
    const child = spawn(command, args, {
      cwd: repoRoot,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: '1' }
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timeout = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      const ended = process.hrtime.bigint();
      const durationMs = Number((ended - started) / 1000000n);
      resolve({ code: killed ? -1 : (code ?? -1), durationMs, stdout, stderr, killed });
    });
  });
}

async function sample(metricName, spec, command, args) {
  const allRuns = [];

  for (let i = 0; i < spec.warmupRuns; i += 1) {
    const warm = await runCommand(command, args);
    allRuns.push({ type: 'warmup', ...warm });
    if (warm.code !== 0) {
      fail(`${metricName} warmup failed (exit ${warm.code}).`);
    }
  }

  const measured = [];
  for (let i = 0; i < spec.sampleRuns; i += 1) {
    const run = await runCommand(command, args);
    allRuns.push({ type: 'sample', ...run });
    if (run.code !== 0) {
      fail(`${metricName} sample ${i + 1}/${spec.sampleRuns} failed (exit ${run.code}).`);
    }
    measured.push(run.durationMs);
  }

  const aggregate = {
    medianMs: median(measured),
    p90Ms: p90(measured),
    stdDevMs: stdDev(measured)
  };

  return { metricName, measured, allRuns, aggregate };
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const budgets = JSON.parse(await fs.readFile(budgetsPath, 'utf8'));

  const envMetadata = {
    timestamp: now(),
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    cpus: os.cpus()?.length ?? 0,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024)
  };

  const apiResult = await sample(
    'apiStartupMs',
    budgets.budgets.apiStartupMs,
    'dotnet',
    ['build', 'apps/Api/AdventureEngine.Api.csproj', '-c', 'Release', '-nologo']
  );

  const pnpmExec = resolvePnpmCommand();

  const storybookResult = await sample(
    'storybookStartupMs',
    budgets.budgets.storybookStartupMs,
    pnpmExec.command,
    [...pnpmExec.preArgs, '--filter', 'web', 'build']
  );

  const results = { envMetadata, metrics: { apiResult, storybookResult } };

  const failures = [];

  for (const [name, result] of Object.entries({
    apiStartupMs: apiResult,
    storybookStartupMs: storybookResult
  })) {
    const budget = budgets.budgets[name];
    if (result.aggregate.medianMs > budget.maxMedianMs) {
      failures.push(`${name}: median ${result.aggregate.medianMs}ms > budget ${budget.maxMedianMs}ms`);
    }
    if (result.aggregate.p90Ms > budget.maxP90Ms) {
      failures.push(`${name}: p90 ${result.aggregate.p90Ms}ms > budget ${budget.maxP90Ms}ms`);
    }
    if (result.aggregate.stdDevMs > budget.maxStdDevMs) {
      failures.push(`${name}: stddev ${result.aggregate.stdDevMs}ms > budget ${budget.maxStdDevMs}ms`);
    }
  }

  await fs.writeFile(path.join(outDir, 'perf-env.json'), JSON.stringify(envMetadata, null, 2));
  await fs.writeFile(path.join(outDir, 'perf-raw-samples.json'), JSON.stringify(results, null, 2));
  await fs.writeFile(
    path.join(outDir, 'perf-aggregate.json'),
    JSON.stringify(
      {
        apiStartupMs: apiResult.aggregate,
        storybookStartupMs: storybookResult.aggregate,
        failures
      },
      null,
      2
    )
  );

  if (failures.length > 0) {
    console.error('PERF_BUDGET_FAIL: one or more budgets were exceeded.');
    for (const failure of failures) {
      console.error(` - ${failure}`);
    }
    process.exit(1);
  }

  console.log('PERF_BUDGET_OK: all performance budgets passed.');
}

main().catch((error) => fail(error.message));
#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const outPath = path.join(repoRoot, '.pi', 'chronicle', 'artifacts', 'tmp', 'item-016-ci-timing-dataset.json');
const workflowFile = process.env.ITEM016_WORKFLOW_FILE || 'perf-budget-gate.yml';
const branch = process.env.ITEM016_BRANCH || 'main';
const baselineLimit = Number(process.env.ITEM016_BASELINE_LIMIT || 20);
const afterLimit = Number(process.env.ITEM016_AFTER_LIMIT || 20);
const afterSha = process.env.ITEM016_AFTER_SHA || '';

function ensureGh() {
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    // gh may still be authenticated from `gh auth login`, so allow execution.
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function toMinutes(ms) {
  return Number((ms / 60000).toFixed(3));
}

async function runGh(args) {
  const { spawn } = await import('node:child_process');
  return new Promise((resolve, reject) => {
    const child = spawn('gh', args, { cwd: repoRoot, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`gh ${args.join(' ')} failed (exit ${code}): ${stderr.trim()}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

function summarize(periodName, runs) {
  const durationsMs = runs.map((r) => r.durationMs);
  if (durationsMs.length === 0) {
    return { period: periodName, sampleSize: 0, medianMinutes: null, p90Minutes: null };
  }
  return {
    period: periodName,
    sampleSize: durationsMs.length,
    medianMinutes: toMinutes(median(durationsMs)),
    p90Minutes: toMinutes(percentile(durationsMs, 90))
  };
}

async function main() {
  ensureGh();

  const fields = 'databaseId,headSha,displayTitle,startedAt,updatedAt,conclusion,url,workflowName';
  const jsonText = await runGh([
    'run',
    'list',
    '--workflow',
    workflowFile,
    '--branch',
    branch,
    '--limit',
    String(Math.max(baselineLimit + afterLimit + 20, 40)),
    '--json',
    fields
  ]);

  const all = JSON.parse(jsonText)
    .filter((r) => r.startedAt && r.updatedAt && r.conclusion === 'success')
    .map((r) => ({
      ...r,
      durationMs: Math.max(0, new Date(r.updatedAt).getTime() - new Date(r.startedAt).getTime())
    }));

  let after = [];
  let baseline = [];

  if (afterSha) {
    after = all.filter((r) => r.headSha.startsWith(afterSha)).slice(0, afterLimit);
    baseline = all.filter((r) => !r.headSha.startsWith(afterSha)).slice(0, baselineLimit);
  } else {
    const midpoint = Math.floor(all.length / 2);
    after = all.slice(0, Math.min(afterLimit, midpoint || afterLimit));
    baseline = all.slice(midpoint, midpoint + baselineLimit);
  }

  const baselineSummary = summarize('baseline', baseline);
  const afterSummary = summarize('after', after);

  const deltaMedianMinutes =
    baselineSummary.medianMinutes == null || afterSummary.medianMinutes == null
      ? null
      : Number((afterSummary.medianMinutes - baselineSummary.medianMinutes).toFixed(3));
  const deltaP90Minutes =
    baselineSummary.p90Minutes == null || afterSummary.p90Minutes == null
      ? null
      : Number((afterSummary.p90Minutes - baselineSummary.p90Minutes).toFixed(3));

  const payload = {
    generatedAt: new Date().toISOString(),
    workflowFile,
    branch,
    afterSha: afterSha || null,
    source: 'gh run list',
    baseline: {
      summary: baselineSummary,
      runs: baseline.map((r) => ({
        runId: r.databaseId,
        headSha: r.headSha,
        startedAt: r.startedAt,
        updatedAt: r.updatedAt,
        durationMinutes: toMinutes(r.durationMs),
        url: r.url
      }))
    },
    after: {
      summary: afterSummary,
      runs: after.map((r) => ({
        runId: r.databaseId,
        headSha: r.headSha,
        startedAt: r.startedAt,
        updatedAt: r.updatedAt,
        durationMinutes: toMinutes(r.durationMs),
        url: r.url
      }))
    },
    deltas: {
      medianMinutes: deltaMedianMinutes,
      p90Minutes: deltaP90Minutes
    }
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

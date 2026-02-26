import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const lockPath = path.join(root, 'pnpm-lock.yaml');

if (!fs.existsSync(lockPath)) {
  console.error('[verify-minimatch] FAIL: pnpm-lock.yaml not found');
  process.exit(1);
}

const lock = fs.readFileSync(lockPath, 'utf8');
const matches = [...lock.matchAll(/\bminimatch@(\d+)\.(\d+)\.(\d+)\b/g)];

if (matches.length === 0) {
  console.error('[verify-minimatch] FAIL: no minimatch entries found in lockfile');
  process.exit(1);
}

const minPatchedMajor = 10;
const offenders = [];
for (const m of matches) {
  const major = Number(m[1]);
  const version = `${m[1]}.${m[2]}.${m[3]}`;
  if (major < minPatchedMajor) offenders.push(version);
}

if (offenders.length > 0) {
  console.error(`[verify-minimatch] FAIL: vulnerable minimatch versions detected: ${[...new Set(offenders)].join(', ')}`);
  process.exit(1);
}

console.log(`[verify-minimatch] PASS: all resolved minimatch versions are >= ${minPatchedMajor}.x`);

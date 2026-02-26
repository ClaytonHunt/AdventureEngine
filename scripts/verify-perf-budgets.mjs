import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const schemaPath = path.join(repoRoot, '.pi', 'chronicle', 'perf-budgets.schema.json');
const budgetsPath = path.join(repoRoot, '.pi', 'chronicle', 'perf-budgets.json');

function fail(message) {
  console.error(`PERF_BUDGET_SCHEMA_FAIL: ${message}`);
  process.exit(1);
}

async function main() {
  const [{ default: Ajv }, schemaData, budgetsData] = await Promise.all([
    import('ajv/dist/2020.js'),
    fs.readFile(schemaPath, 'utf8'),
    fs.readFile(budgetsPath, 'utf8')
  ]);

  const ajv = new Ajv({ allErrors: true, strict: true });

  let schema;
  let budgets;

  try {
    schema = JSON.parse(schemaData);
    budgets = JSON.parse(budgetsData);
  } catch (error) {
    fail(`invalid JSON: ${error.message}`);
  }

  const validate = ajv.compile(schema);
  const valid = validate(budgets);

  if (!valid) {
    const details = (validate.errors ?? [])
      .map((err) => `${err.instancePath || '/'} ${err.message}`)
      .join('; ');
    fail(details || 'unknown schema validation error');
  }

  console.log('PERF_BUDGET_SCHEMA_OK: perf budgets file is valid.');
}

main().catch((error) => fail(error.message));

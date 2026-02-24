---
name: vitest
description: Vitest testing patterns, configuration, and best practices. Load when writing or running tests in a Vitest project.
---

# Vitest

Reference: https://vitest.dev

## Running Tests

```bash
# Run all tests once
npx vitest run

# Watch mode (re-runs on change)
npx vitest

# Run a specific file
npx vitest run src/auth/auth.service.test.ts

# Run tests matching a name pattern
npx vitest run --reporter=verbose -t "createUser"

# Run with coverage
npx vitest run --coverage

# UI mode (browser dashboard)
npx vitest --ui
```

## Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,           // no need to import describe/it/expect
    environment: 'node',     // or 'jsdom' for browser-like tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.config.*'],
    },
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

## Core API

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('MyService', () => {
  beforeEach(() => { /* runs before each test */ });
  afterEach(() => { /* runs after each test */ });

  it('does the thing', () => {
    expect(result).toBe(expected);
    expect(obj).toEqual({ key: 'value' });
    expect(arr).toContain(item);
    expect(fn).toThrow(ErrorClass);
    expect(promise).rejects.toThrow('message');
    expect(promise).resolves.toBe(value);
  });
});
```

## Mocking with `vi`

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('./email-service', () => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

// Spy on a method
const spy = vi.spyOn(service, 'sendEmail').mockResolvedValue({ sent: true });
expect(spy).toHaveBeenCalledWith({ to: 'user@example.com' });

// Mock timers
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();

// Reset mocks between tests
beforeEach(() => vi.clearAllMocks());
```

## Snapshot Testing

```typescript
it('renders correctly', () => {
  expect(output).toMatchSnapshot();       // creates/compares .snap file
  expect(output).toMatchInlineSnapshot(`  // inline snapshot
    "expected output"
  `);
});

// Update snapshots
npx vitest run --update-snapshots
```

## Testing Async Code

```typescript
// Async/await (preferred)
it('fetches user', async () => {
  const user = await userService.getById('123');
  expect(user.name).toBe('Alice');
});

// Promises
it('rejects on invalid id', () => {
  return expect(userService.getById('')).rejects.toThrow(ValidationError);
});
```

## Testing with TypeScript

```typescript
// Type-safe mocks
import { Mocked } from 'vitest';

const mockRepo: Mocked<UserRepository> = {
  findById: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};
```

## Common Patterns

### Testing Express handlers
```typescript
import { createRequest, createResponse } from 'node-mocks-http';

it('returns 404 when user not found', async () => {
  const req = createRequest({ params: { id: '999' } });
  const res = createResponse();
  await getUserHandler(req, res);
  expect(res.statusCode).toBe(404);
});
```

### Testing with environment variables
```typescript
import { beforeAll } from 'vitest';

beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://localhost/test';
});
```

## Common Matchers Quick Reference

```typescript
// Equality
expect(val).toBe(2)           // ===
expect(val).toEqual({a: 1})   // deep equality
expect(val).not.toBe(null)

// Truthiness
expect(val).toBeTruthy()
expect(val).toBeFalsy()
expect(val).toBeNull()
expect(val).toBeUndefined()
expect(val).toBeDefined()

// Numbers
expect(val).toBeGreaterThan(3)
expect(val).toBeLessThanOrEqual(10)
expect(val).toBeCloseTo(0.3, 5)

// Strings
expect(str).toContain('substring')
expect(str).toMatch(/regex/)

// Arrays
expect(arr).toHaveLength(3)
expect(arr).toContain(item)
expect(arr).toEqual(expect.arrayContaining([1, 2]))

// Objects
expect(obj).toHaveProperty('key', value)
expect(obj).toMatchObject({ partial: 'match' })

// Functions/mocks
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledTimes(2)
expect(fn).toHaveBeenCalledWith(arg1, arg2)
expect(fn).toHaveBeenLastCalledWith(arg)
```

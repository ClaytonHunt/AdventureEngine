---
name: jest
description: Jest testing patterns, configuration, mocking, and best practices. Load when writing or running tests in a Jest project.
---

# Jest

Reference: https://jestjs.io

## Running Tests

```bash
# Run all tests
npx jest

# Watch mode
npx jest --watch

# Run a specific file
npx jest src/auth/auth.service.test.ts

# Run tests matching a name
npx jest -t "createUser"

# Run with coverage
npx jest --coverage

# Verbose output
npx jest --verbose
```

## Configuration (`jest.config.ts`)

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
  coverageThreshold: {
    global: { lines: 80, functions: 80, branches: 80, statements: 80 },
  },
  setupFilesAfterFramework: ['<rootDir>/src/test/setup.ts'],
};

export default config;
```

## Core API

```typescript
describe('MyService', () => {
  beforeEach(() => { /* runs before each test */ });
  afterEach(() => { /* runs after each test */ });
  beforeAll(() => { /* runs once before all tests */ });
  afterAll(() => { /* runs once after all tests */ });

  it('does the thing', () => {
    expect(result).toBe(expected);
    expect(obj).toEqual({ key: 'value' });
    expect(fn).toThrow(ErrorClass);
  });

  test.each([
    [1, 2, 3],
    [2, 3, 5],
  ])('adds %i + %i = %i', (a, b, expected) => {
    expect(add(a, b)).toBe(expected);
  });
});
```

## Mocking

```typescript
// Auto-mock a module
jest.mock('./email-service');

// Manual mock with implementation
jest.mock('./email-service', () => ({
  sendEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

// Spy on a method
const spy = jest.spyOn(service, 'sendEmail')
  .mockResolvedValue({ sent: true });
expect(spy).toHaveBeenCalledWith({ to: 'user@example.com' });
spy.mockRestore(); // restore original

// Mock timers
jest.useFakeTimers();
jest.advanceTimersByTime(1000);
jest.runAllTimers();
jest.useRealTimers();

// Reset between tests
beforeEach(() => {
  jest.clearAllMocks();   // clear call history
  jest.resetAllMocks();   // clear + reset implementations
  jest.restoreAllMocks(); // clear + restore all spies
});
```

## Async Testing

```typescript
// Async/await
it('fetches user', async () => {
  const user = await userService.getById('123');
  expect(user.name).toBe('Alice');
});

// Promises
it('rejects on empty id', () => {
  return expect(userService.getById('')).rejects.toThrow(ValidationError);
});

// Callbacks (legacy)
it('calls back with data', (done) => {
  fetchData((data) => {
    expect(data).toBeDefined();
    done();
  });
});
```

## TypeScript Mocks

```typescript
import { jest } from '@jest/globals';

// Type-safe mock
const mockRepo = {
  findById: jest.fn<() => Promise<User>>(),
  save: jest.fn<(user: User) => Promise<void>>(),
};

// Using jest-mock-extended
import { mock } from 'jest-mock-extended';
const mockRepo = mock<UserRepository>();
mockRepo.findById.mockResolvedValue({ id: '1', name: 'Alice' });
```

## Common Matchers

```typescript
// Equality
expect(val).toBe(2)
expect(val).toEqual({ a: 1 })
expect(val).toStrictEqual({ a: 1 })  // stricter (checks undefined props)

// Truthiness
expect(val).toBeTruthy()
expect(val).toBeFalsy()
expect(val).toBeNull()
expect(val).toBeUndefined()
expect(val).toBeDefined()

// Numbers
expect(val).toBeGreaterThan(3)
expect(val).toBeCloseTo(0.3, 5)

// Strings
expect(str).toContain('substring')
expect(str).toMatch(/regex/)

// Arrays
expect(arr).toHaveLength(3)
expect(arr).toContain(item)
expect(arr).toEqual(expect.arrayContaining([1, 2]))

// Objects
expect(obj).toHaveProperty('key.nested', value)
expect(obj).toMatchObject({ partial: 'match' })
expect(obj).toMatchSnapshot()

// Functions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledTimes(2)
expect(fn).toHaveBeenCalledWith(arg1, arg2)
expect(fn).toHaveBeenNthCalledWith(1, arg)
```

## Extending Jest (`@types/jest`)

```typescript
// Custom matcher
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => `expected ${received} to be within [${floor}, ${ceiling}]`,
    };
  },
});
```

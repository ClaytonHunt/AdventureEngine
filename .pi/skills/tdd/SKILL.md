---
name: tdd
description: Test-Driven Development workflow — red/green/refactor cycle, what to test, test structure, and TDD discipline rules. Load this skill when writing any new code or fixing bugs.
---

# Test-Driven Development (TDD)

## The Cardinal Rule
**Write the test BEFORE writing the implementation code.**
If you find yourself writing implementation first, stop, delete it, write the test, then re-implement.

## The Red/Green/Refactor Cycle

```
1. RED    — Write a failing test for the next small piece of behavior
2. GREEN  — Write the MINIMUM code to make the test pass (no more)
3. REFACTOR — Clean up the code while keeping tests green
4. Repeat
```

### RED phase
- Write ONE test at a time
- The test should fail for the RIGHT reason (not a syntax error)
- The test should describe the desired behavior clearly
- Run it and confirm it fails: `npm test -- --run`

### GREEN phase
- Write the SIMPLEST possible code to make the test pass
- Do NOT write code for future tests — only what's needed now
- Hardcoding is acceptable at this phase (you'll refactor it away)
- Do NOT add logic the tests don't require yet

### REFACTOR phase
- Eliminate duplication
- Improve names, structure, and readability
- Extract functions/classes if the code is getting complex
- Keep all tests green throughout — run tests after each small change

---

## What to Test

### Test THIS
- Pure business logic (calculations, transformations, validations)
- Edge cases: empty inputs, null, zero, max values, boundary conditions
- Error paths: what happens when things go wrong
- Branching logic: each `if`/`else` branch
- Integration between collaborators (with test doubles)

### Do NOT test THIS directly
- Implementation details (private methods, internal state)
- Framework behavior (React rendering, Express routing internals)
- Third-party library internals
- Things that are already covered by other tests

---

## Test Structure (Arrange/Act/Assert)

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('returns a user with the provided email', async () => {
      // Arrange
      const repo = createMockUserRepo();
      const service = new UserService(repo);
      const email = 'test@example.com';

      // Act
      const user = await service.createUser({ email });

      // Assert
      expect(user.email).toBe(email);
    });

    it('throws ValidationError when email is missing', async () => {
      // Arrange
      const service = new UserService(createMockUserRepo());

      // Act & Assert
      await expect(service.createUser({ email: '' }))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

## Test Naming Convention
```
it('<does something> when <condition>')
it('returns <result> given <input>')
it('throws <error> when <condition>')
it('calls <dependency> with <args> when <condition>')
```

---

## Test Doubles

### Use the right double for the job
| Double | Use when |
|---|---|
| **Stub** | You need to control the return value of a dependency |
| **Mock** | You need to verify a dependency was called correctly |
| **Spy** | You want to wrap a real object and observe calls |
| **Fake** | You need a working implementation (e.g. in-memory DB) |

### Prefer dependency injection
```typescript
// BAD — hard to test
class OrderService {
  async submit(order: Order) {
    await db.orders.insert(order);  // direct dependency
  }
}

// GOOD — injectable, testable
class OrderService {
  constructor(private readonly repo: OrderRepository) {}

  async submit(order: Order) {
    await this.repo.insert(order);
  }
}
```

---

## TDD for Bug Fixes

When fixing a bug, ALWAYS start by writing a test that reproduces it:

```
1. Write a test that FAILS because of the bug
2. Run it and confirm it fails (proves the test catches the bug)
3. Fix the bug
4. Run the test — it should now pass
5. Run the full test suite — nothing else should break
```

This gives you a regression test for free.

---

## Discipline Rules
- Never skip writing a test because "it's obvious" — it's probably not
- Never write a test that can't fail (always verify it fails first)
- Delete tests that are no longer useful — dead tests create noise
- Keep tests fast: unit tests < 100ms, integration tests < 1s
- One assertion per test when possible (multiple related assertions OK)
- Tests are production code — keep them clean and readable

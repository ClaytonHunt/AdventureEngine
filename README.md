# AdventureEngine

> A full-stack adventure game engine built with React, ASP.NET Core, and .NET Aspire —
> architected around Vertical Slice Architecture, Clean Architecture, and Domain-Driven Design.

**Current status:** Sprint 1 complete — monorepo foundation, DDD base types, Aspire
orchestration. Sprint 2 (API + React app) in planning.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TypeScript · Vite *(Sprint 2)* |
| Backend API | ASP.NET Core · .NET 10 · OpenAPI *(Sprint 2)* |
| Orchestration | .NET Aspire 13.1.1 |
| Shared library | AdventureEngine.SharedKernel (DDD primitives) |
| Package manager | pnpm 10 (workspaces) |
| Test frameworks | xUnit 2.9.2 (backend) · Vitest *(Sprint 2)* · Playwright *(Sprint 3)* |
| Observability | OpenTelemetry (traces · metrics · logs) via OTLP |

---

## Architecture

AdventureEngine uses **Vertical Slice Architecture** as its primary organising principle,
wrapping **Clean Architecture** layer boundaries and **DDD** tactical patterns.

```
adventure-engine/
├── apps/
│   ├── AppHost/          ← .NET Aspire orchestrator (local dev only)
│   └── Api/              ← ASP.NET Core Web API  [Sprint 2]
│       └── Features/
│           └── <Name>/   ← one folder per vertical slice
├── packages/
│   ├── SharedKernel/     ← DDD base types: Entity, ValueObject, AggregateRoot,
│   │                        Result<T>, Error, IRepository, IUnitOfWork
│   ├── SharedKernel.Tests/
│   └── ServiceDefaults/  ← OTel, health checks, resilience (consumed by each service)
└── apps/web/             ← React + Vite frontend  [Sprint 2]
```

### Key design rules

- **No MediatR.** `IDomainEvent` is a plain interface. Feature slices dispatch events
  directly through their own handler types.
- **`IRepository` has no `SaveChangesAsync`.** Persistence is committed via `IUnitOfWork`,
  which keeps multi-aggregate transactions explicit.
- **`Result<T>` — no exceptions for control flow.** Domain operations return
  `Result<T>` or `Result`. Errors carry `Code`, user-safe `Message`, and an optional
  `InternalDetail` that must never leave the service boundary.
- **`Entity` equality is type-aware.** `Order(id=1)` and `Customer(id=1)` are never
  equal — `GetType()` is included in both `Equals()` and `GetHashCode()`.

---

## Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| .NET SDK | 10.0+ (`rollForward: latestPatch`) |
| Node.js | 22 LTS |
| pnpm | 10+ |

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full setup instructions, including the
one-time `dotnet dev-certs https --trust` step required for the Aspire dashboard.

### 1 — Clone and install

```bash
git clone https://github.com/your-org/adventure-engine.git
cd adventure-engine

pnpm install          # Node workspace packages
dotnet restore        # NuGet packages (all projects)
```

### 2 — Build

```bash
dotnet build AdventureEngine.slnx
```

Expected: **zero warnings, zero errors.**

### 3 — Test

```bash
dotnet test AdventureEngine.slnx
```

Expected: **43 tests, 0 failures** (Sprint 1 baseline).

### 4 — Start the Aspire dashboard

```bash
dotnet run --project apps/AppHost
```

The .NET Aspire dashboard opens at **https://localhost:15888** (HTTPS, protected by a
browser session token — development only).

> Sprint 1: the dashboard starts with no services registered. The API and React app
> are added in Sprint 2.

---

## SharedKernel API Reference

The `packages/SharedKernel` library provides the DDD building blocks used by every
feature slice. All types live in the `AdventureEngine.SharedKernel` namespace.

### `Entity<TId>`

Base class for domain entities. Equality is identity-based (type + `Id`).

```csharp
public sealed class Order : Entity<Guid>
{
    public Order(Guid id) : base(id) { }
}

var a = new Order(Guid.Parse("..."));
var b = new Order(Guid.Parse("..."));  // same id
a == b; // true

var c = new Customer(Guid.Parse("...")); // same id, different type
a == c; // false  ← GetType() check prevents cross-type collision
```

### `ValueObject`

Base class for value objects. Equality is structural.

```csharp
public sealed class Money : ValueObject
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
}

new Money(10m, "USD") == new Money(10m, "USD"); // true
new Money(10m, "USD") == new Money(10m, "EUR"); // false
```

### `AggregateRoot<TId>`

Extends `Entity<TId>` with domain event ownership. Infrastructure accesses events via
`IDomainEventContainer` after persistence.

```csharp
public sealed class Order : AggregateRoot<Guid>
{
    public Order(Guid id) : base(id) { }

    public void Submit()
    {
        // ... guard conditions ...
        AddDomainEvent(new OrderSubmitted(Guid.CreateVersion7(), DateTimeOffset.UtcNow, Id));
    }
}

// In a post-save EF Core interceptor or dispatcher:
IDomainEventContainer container = order;
foreach (var evt in container.DomainEvents)
    await dispatcher.DispatchAsync(evt);
container.ClearDomainEvents();
```

### `IDomainEvent`

Plain marker interface. No MediatR dependency.

```csharp
public sealed record OrderSubmitted(
    Guid EventId,
    DateTimeOffset OccurredOn,
    Guid OrderId) : IDomainEvent;
// Use Guid.CreateVersion7() for EventId — sequential, B-tree-friendly.
```

### `IRepository<T, TId>` and `IUnitOfWork`

`SaveChangesAsync` lives on `IUnitOfWork`, not on the repository.

```csharp
// In a feature slice handler:
public async Task<Result<Guid>> Handle(CreateOrderCommand cmd, CancellationToken ct)
{
    var order = Order.Create(Guid.CreateVersion7(), cmd.CustomerId);
    await _orders.AddAsync(order, ct);
    await _uow.SaveChangesAsync(ct);
    return order.Id;
}
```

### `Result<T>` and `Result`

No exceptions for control flow. Use `Match()` for exhaustive handling.

```csharp
// Returning a result:
public Result<Order> GetOrder(Guid id)
{
    var order = _store.Find(id);
    if (order is null)
        return Error.NotFound("Order");   // implicit operator
    return order;                          // implicit operator
}

// Consuming a result:
var result = GetOrder(id);
var response = result.Match(
    order  => Results.Ok(order.ToDto()),
    error  => Results.NotFound(new { error.Code, error.Message })
);
```

### `Error`

`sealed record` with static factories. `InternalDetail` is log-only — never send it to
API consumers.

```csharp
Error.NotFound("Order")
// → Code: "Order.NotFound", Message: "Order was not found."

Error.Validation("Email", "must be a valid email address")
// → Code: "Email.Validation", Message: "must be a valid email address"

Error.Conflict("Order")
// → Code: "Order.Conflict", Message: "Order already exists."

Error.Unexpected(internalDetail: ex.ToString())
// → Code: "Unexpected", Message: "An unexpected error occurred."
//   InternalDetail: <exception — log only, never return to caller>
```

---

## ServiceDefaults

Every service project (API, background workers) calls `AddServiceDefaults()` once
in `Program.cs`:

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();

var app = builder.Build();
app.MapDefaultEndpoints();   // /health/live, /health/ready (Development only)
app.Run();
```

What `AddServiceDefaults()` configures:

| Concern | Details |
|---|---|
| **OTel traces** | ASP.NET Core + HTTP client instrumentation |
| **OTel metrics** | ASP.NET Core + HTTP client + .NET runtime |
| **OTel logs** | Structured, with scopes and formatted message |
| **OTLP export** | Enabled when `OTEL_EXPORTER_OTLP_ENDPOINT` is set |
| **Health checks** | Liveness at `/health/live` · Readiness at `/health/ready` |
| **Resilience** | Standard HTTP client resilience pipeline |
| **Service discovery** | .NET service discovery on all `HttpClient` registrations |

---

## Contributing

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for:

- Prerequisites and one-time machine setup
- Local port reference table
- How to run and write tests
- Component file structure convention (Frontend)
- Security guidelines

---

## Changelog

See **[CHANGELOG.md](./CHANGELOG.md)** for the full history of sprint deliveries and
technical decisions.

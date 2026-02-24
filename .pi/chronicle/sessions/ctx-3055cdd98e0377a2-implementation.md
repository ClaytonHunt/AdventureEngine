
## Workflow: Feature Full — State: Implementation
**Role:** Code generation and implementation — implement only the scoped increment, all specialist review feedback must be addressed

## Workflow History
### State: Scope Review [Scope Reviewer]
**Task:** 
## Sprint 1 — Scope Review Gate

Sprint 1 has been pre-groomed and sprint-planned. Your job is to **confirm the increment is properly bounded**, define the single combined acceptance criteria surface, and approve it for planning. Do NOT re-scope or break items down — they are already correctly sized.

---

### Sprint 1 Increment: Foundation Layer

**Sprint Goal:** By end of Sprint 1, any developer can clone the repo and have a working monorepo with a passing .NET solution (SharedKernel library + Aspire AppHost wired together), confirmed by `dotnet build` succeeding and a `dotnet test` run executing (with no failing tests).

**Three in-sprint items:**

#### item-001 — Scaffold monorepo folder structure + root `package.json`
- Create repo root with `apps/` and `packages/` top-level folders
- Root `package.json` with pnpm workspaces config pointing to `apps/*` and `packages/*`
- `.gitignore` covering Node, .NET, JetBrains, VS Code, macOS
- `.nvmrc` pinned to current LTS Node
- `.editorconfig` for consistent formatting across editors
- `global.json` pinning .NET 9 SDK version
- `Directory.Build.props` for shared MSBuild properties (nullable enabled, implicit usings, treat warnings as errors)
- `Directory.Packages.props` for centralized NuGet package version management (CPM)
- Empty `README.md` placeholder
- `dotnet new sln` solution file at repo root

#### item-002 — SharedKernel C# class library with DDD building blocks
- `packages/SharedKernel/` — C# class library targeting `net9.0`
- Added to the solution file
- Base DDD types implemented:
  - `Entity<TId>` — base entity with typed Id, equality by Id
  - `ValueObject` — abstract base with structural equality via `GetEqualityComponents()`
  - `AggregateRoot<TId>` — extends Entity, holds `IReadOnlyList<IDomainEvent>` with `AddDomainEvent()` / `ClearDomainEvents()`
  - `IDomainEvent` — marker interface (implements `INotification`-compatible structure without MediatR)
  - `IRepository<T, TId>` — generic repository interface: `GetByIdAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync`, `SaveChangesAsync`
  - `Result<T>` — discriminated union: `Success(T value)` / `Failure(Error error)` with implicit operators
  - `Error` — record type: `Code` (string) + `Message` (string) + static factory methods (`NotFound`, `Validation`, `Conflict`, `Unexpected`)
- Unit test project `packages/SharedKernel.Tests/` with xUnit + FluentAssertions + NSubstitute; added to solution
- Tests covering: Entity equality, ValueObject equality, AggregateRoot domain event lifecycle, Result success/failure paths, Error factory methods

#### item-003 — .NET Aspire AppHost + ServiceDefaults
- `apps/AppHost/` — .NET Aspire AppHost project (`net9.0`, `Aspire.Hosting.AppHost` SDK)
- `packages/ServiceDefaults/` — ServiceDefaults project (`net9.0`) with `AddServiceDefaults()` extension: health checks (live + ready), OpenTelemetry (traces + metrics + logs), resilience defaults, service discovery
- AppHost references ServiceDefaults; AppHost added to solution
- AppHost `Program.cs` minimal: `var builder = DistributedApplication.CreateBuilder(args); builder.Build().Run();` (no services wired yet — the API comes in Sprint 2)
- `dotnet build` succeeds across the full solution
- `dotnet dev-certs https --trust` documented in a `CONTRIBUTING.md` prerequisite section

---

### Architectural Decisions Already Locked (do not re-open)
1. **Folder convention:** `apps/` for runnable apps, `packages/` for shared libraries
2. **OpenAPI:** Built-in .NET 9 — not relevant this sprint
3. **Playwright:** `apps/web/e2e/` — not relevant this sprint
4. **Docker Compose:** Included — not relevant this sprint
5. **Dev cert:** Documented in item-003 + README

### Constraints
- No MediatR. `IDomainEvent` is a plain marker interface.
- `IRepository<T, TId>` is an interface only — no EF Core implementation this sprint
- No frontend work this sprint
- No API project this sprint (comes in Sprint 2 as item-004)
- `Result<T>` must not use exceptions for control flow

### Definition of Done for this Increment
- [ ] `dotnet build` exits 0 from repo root
- [ ] `dotnet test` exits 0 from repo root (all SharedKernel tests pass)
- [ ] `dotnet run --project apps/AppHost` starts the Aspire dashboard without errors
- [ ] `pnpm install` succeeds from repo root (workspaces recognized)
- [ ] All DDD base types exist in `packages/SharedKernel/`
- [ ] SharedKernel unit tests cover all base types with ≥1 test each
- [ ] `CONTRIBUTING.md` has Prerequisites section with `dotnet dev-certs` command
- [ ] No compiler warnings (warnings-as-errors enabled via `Directory.Build.props`)

### Your Output
Confirm the increment is correctly bounded, state any risks or assumptions, and declare it **APPROVED FOR PLANNING** with the above acceptance criteria locked.

**Summary:** Scope review initiated for Sprint 1 — three foundational items (monorepo scaffold, SharedKernel, Aspire AppHost) representing the complete .NET + monorepo foundation layer. All items are pre-groomed, sized at 2pt each (6pt total), and locked in the backlog as in-sprint.

### State: Planning [Planner] (2m51s)
**Task:** 
## Architecture Review — Sprint 1 Foundation Layer

Review the architectural decisions for the Sprint 1 increment **before implementation begins**. Focus on structural correctness, coupling, cohesion, SOLID compliance, and the long-term fitness of the foundations being laid. Everything here becomes the bedrock the entire application builds on — scrutinise accordingly.

---

### What Is Being Built

Three inter-dependent foundational items:

**item-001 — Monorepo scaffold**
```
adventure-engine/               ← repo root
├── apps/
│   └── AppHost/                ← .NET Aspire AppHost (item-003)
├── packages/
│   ├── SharedKernel/           ← C# class library (item-002)
│   ├── SharedKernel.Tests/     ← xUnit test project (item-002)
│   └── ServiceDefaults/        ← Aspire ServiceDefaults extension (item-003)
├── package.json                ← pnpm workspaces root
├── pnpm-workspace.yaml
├── .gitignore / .editorconfig / .nvmrc
├── global.json                 ← pins .NET 9 SDK
├── Directory.Build.props       ← shared MSBuild: Nullable, ImplicitUsings, TreatWarningsAsErrors
├── Directory.Packages.props    ← centralized NuGet version management (CPM)
└── AdventureEngine.sln
```

**item-002 — SharedKernel DDD base types**
```
packages/SharedKernel/
└── src/
    ├── Primitives/
    │   ├── Entity.cs            ← Entity<TId>
    │   ├── ValueObject.cs       ← abstract structural equality
    │   ├── AggregateRoot.cs     ← extends Entity<TId>, owns domain events
    │   └── IDomainEvent.cs      ← plain marker interface (NO MediatR)
    ├── Repositories/
    │   └── IRepository.cs       ← IRepository<T, TId> interface only
    └── Results/
        ├── Result.cs            ← Result<T>: Success | Failure with implicit operators
        └── Error.cs             ← record Error(Code, Message) + static factories
```

**item-003 — Aspire AppHost + ServiceDefaults**
```
apps/AppHost/
├── AppHost.csproj              ← Aspire.Hosting.AppHost SDK, net9.0
└── Program.cs                  ← minimal: CreateBuilder + Build + Run (no services yet)

packages/ServiceDefaults/
├── ServiceDefaults.csproj      ← net9.0, references Aspire.ServiceDefaults packages
└── Extensions.cs               ← AddServiceDefaults(): health checks, OTel, resilience, service discovery
```

---

### Architectural Decisions Under Review

#### 1. SharedKernel Design — SOLID Compliance

**Entity<TId>:**
```csharp
public abstract class Entity<TId>
    where TId : notnull
{
    public TId Id { get; protected init; }
    protected Entity(TId id) => Id = id;
    public override bool Equals(object? obj) => obj is Entity<TId> e && Id.Equals(e.Id);
    public override int GetHashCode() => Id.GetHashCode();
    public static bool operator ==(Entity<TId>? a, Entity<TId>? b) => a?.Equals(b) ?? b is null;
    public static bool operator !=(Entity<TId>? a, Entity<TId>? b) => !(a == b);
}
```
Review: Is the generic constraint sufficient? Should `IEquatable<Entity<TId>>` be implemented? Is `protected init` the right accessor for `Id`?

**ValueObject:**
```csharp
public abstract class ValueObject
{
    protected abstract IEnumerable<object?> GetEqualityComponents();
    public override bool Equals(object? obj) =>
        obj?.GetType() == GetType() &&
        obj is ValueObject vo &&
        GetEqualityComponents().SequenceEqual(vo.GetEqualityComponents());
    public override int GetHashCode() =>
        GetEqualityComponents().Aggregate(0, HashCode.Combine);
    public static bool operator ==(ValueObject? a, ValueObject? b) => a?.Equals(b) ?? b is null;
    public static bool operator !=(ValueObject? a, ValueObject? b) => !(a == b);
}
```
Review: Is the `GetType()` check correct for inheritance? Is `HashCode.Combine` with `Aggregate` safe for variable-length sequences?

**AggregateRoot<TId>:**
```csharp
public abstract class AggregateRoot<TId> : Entity<TId>
    where TId : notnull
{
    private readonly List<IDomainEvent> _domainEvents = [];
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    protected AggregateRoot(TId id) : base(id) { }
    protected void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}
```
Review: Should `ClearDomainEvents` be public or protected? Who should have the authority to clear events — the aggregate itself, or the infrastructure layer (event dispatcher)?

**IDomainEvent (no MediatR):**
```csharp
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredOn { get; }
}
```
Review: Is `Guid EventId` + `DateTime OccurredOn` the right baseline contract? Should it use `DateTimeOffset` instead of `DateTime`? Should `EventId` be a strongly-typed ID (e.g. `DomainEventId`) or `Guid` is fine at this layer?

**IRepository<T, TId>:**
```csharp
public interface IRepository<T, TId>
    where T : AggregateRoot<TId>
    where TId : notnull
{
    Task<T?> GetByIdAsync(TId id, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(TId id, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
```
Review: Is `SaveChangesAsync` on the repository interface the right place for this (leaks persistence concern)? Should there be a separate `IUnitOfWork`? Is `UpdateAsync` needed or should mutation be implicit via change tracking?

**Result<T> / Error:**
```csharp
public sealed class Result<T>
{
    public T? Value { get; }
    public Error? Error { get; }
    public bool IsSuccess { get; }
    private Result(T value) { Value = value; IsSuccess = true; }
    private Result(Error error) { Error = error; IsSuccess = false; }
    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(Error error) => new(error);
    public static implicit operator Result<T>(T value) => Success(value);
    public static implicit operator Result<T>(Error error) => Failure(error);
}

public sealed record Error(string Code, string Message)
{
    public static Error NotFound(string resource) => new($"{resource}.NotFound", $"{resource} was not found.");
    public static Error Validation(string field, string reason) => new($"{field}.Validation", reason);
    public static Error Conflict(string resource) => new($"{resource}.Conflict", $"{resource} already exists.");
    public static Error Unexpected(string detail) => new("Unexpected", detail);
}
```
Review: Should `Result<T>` also have a non-generic `Result` for void operations? Are implicit operators a good idea or do they hide intent? Should `Match<TOut>(Func<T,TOut> onSuccess, Func<Error,TOut> onFailure)` be included?

#### 2. Project Structure — Layering and Coupling

- Is `SharedKernel` as a `packages/` workspace member the right home, or should it be a `src/` subfolder?
- Does `ServiceDefaults` belong in `packages/` (shared library) or `apps/` (Aspire-specific infrastructure)?
- Should `AppHost` reference `ServiceDefaults` directly, or should individual service projects reference it?

#### 3. Centralized Package Management (CPM)
- Are there any packages that should NOT be in CPM (e.g. Aspire workload packages that have their own versioning)?
- `Directory.Build.props` with `TreatWarningsAsErrors=true` globally — is this safe for the Aspire SDK which emits some analyzer warnings?

#### 4. MSBuild Hierarchy
- `Directory.Build.props` at repo root applies to ALL projects. Is there anything that .NET test projects need differently (e.g. should `TreatWarningsAsErrors` be suppressed for test projects to allow `[Obsolete]` usage in tests)?

---

### Specific Questions to Answer

1. Should `Entity<TId>` implement `IEquatable<Entity<TId>>` explicitly?
2. Is `DateTimeOffset` vs `DateTime` the right choice for `IDomainEvent.OccurredOn`?
3. `SaveChangesAsync` on `IRepository` — keep it, or split to `IUnitOfWork`?
4. Should `Result<T>` include a non-generic `Result` type and a `Match()` method?
5. `ClearDomainEvents` — public (infrastructure calls it) or protected (aggregate-internal)?
6. Is the proposed folder layout (`Primitives/`, `Repositories/`, `Results/`) the right cohesion split for SharedKernel?
7. Should `ServiceDefaults` live in `packages/` or `apps/`?
8. Any warnings that need to be suppressed in `Directory.Build.props` for Aspire projects?

---

### Context
- Architecture pattern: Vertical Slice Architecture wrapping Clean Architecture + DDD
- No MediatR anywhere
- No EF Core this sprint (IRepository is interface-only)
- Target: .NET 9
- All future feature slices in `apps/Api/Features/<Name>/` will depend on SharedKernel
- The application is called AdventureEngine

**Summary:** Planning complete — Sprint 1 increment approved, full implementation task breakdown produced covering all three items (monorepo scaffold, SharedKernel, Aspire AppHost). Six risks documented, all mitigated. Implementation order locked: item-001 → item-002 + item-003 parallel.

### State: Architecture Review [Architect] (2m42s)
**Task:** 
## Security Review — Sprint 1 Foundation Layer

Pre-implementation security review for the Sprint 1 foundational increment. This sprint establishes the SharedKernel (DDD base types) and the .NET Aspire AppHost scaffolding. Review for any security concerns that should be baked in from day one.

---

### What Is Being Built

**Monorepo scaffold (item-001):**
- `Directory.Build.props`, `Directory.Packages.props`, `global.json`, `.gitignore`, `.editorconfig`, `.nvmrc`
- pnpm workspace `package.json` + `pnpm-workspace.yaml`
- `.sln` solution file

**SharedKernel library (item-002) — `packages/SharedKernel/`:**
```csharp
// Primitives
abstract class Entity<TId> : IEquatable<Entity<TId>> where TId : notnull
abstract class ValueObject                                      // structural equality
abstract class AggregateRoot<TId> : Entity<TId>               // owns domain events
interface IDomainEvent { Guid EventId; DateTimeOffset OccurredOn; }  // marker interface, NO MediatR

// Repositories
interface IRepository<T, TId> where T : AggregateRoot<TId>    // NO SaveChangesAsync (split to IUnitOfWork)
interface IUnitOfWork                                          // SaveChangesAsync only

// Results
sealed class Result<T>                                         // Success | Failure, implicit operators
sealed class Result                                            // non-generic for void ops
sealed record Error(string Code, string Message)               // static factories: NotFound/Validation/Conflict/Unexpected
```

**Aspire AppHost (item-003) — `apps/AppHost/`:**
- Minimal `Program.cs`: `DistributedApplication.CreateBuilder(args).Build().Run()`
- No services wired yet (API comes in Sprint 2)
- Aspire dashboard accessible at `https://localhost:15888` (default)

**ServiceDefaults (item-003) — `packages/ServiceDefaults/`:**
- `AddServiceDefaults()` extension: OpenTelemetry (traces + metrics + logs), health checks (/health/live + /health/ready), resilience defaults, service discovery

---

### Architecture Decisions Already Locked
- No MediatR, `IDomainEvent` is a plain interface
- `IRepository` has no `SaveChangesAsync` — split to `IUnitOfWork`
- `Result<T>` uses implicit operators, no exceptions for control flow
- `TreatWarningsAsErrors = true` in `Directory.Build.props`
- `.NET 9 SDK` pinned in `global.json`

---

### Threat Model Scope for This Sprint

Given that this sprint produces **no HTTP endpoints, no authentication, no database, no user input, and no network-facing code** (AppHost is a local orchestration tool only), the threat surface is primarily:

1. **Supply chain / dependency security** (NuGet + npm packages added this sprint)
2. **Build-time security** (MSBuild configuration, secrets in config files)
3. **Developer machine security** (dev certs, environment variables, `.gitignore` coverage)
4. **Future-proofing** — design decisions made now that will create security debt if not addressed

---

### Specific Questions to Answer

1. **`Error` record with static factories** — are there any information disclosure risks in the `Error.Code` and `Error.Message` values being surfaced to API consumers in future sprints? Should the design include a `UserMessage` vs `InternalMessage` split now?

2. **`IDomainEvent` with `Guid EventId`** — is there a risk of event ID collisions with `Guid.NewGuid()`? Should it be `Guid.CreateVersion7()` (.NET 9 sequential GUID) for ordering guarantees?

3. **`global.json` pinning a specific .NET 9 SDK version** — should it use `"rollForward": "latestPatch"` to allow security patches without a lockfile update? Or should it pin exactly to control the build environment?

4. **`.gitignore`** — what files specific to this stack must be excluded to prevent secret leakage? (Aspire secrets, `appsettings.Development.json`, `.env` files, user secrets, etc.)

5. **`Directory.Packages.props`** — are there any NuGet packages planned for Sprint 1 that have known CVEs or should be pinned to specific patch versions?

6. **Aspire dashboard** — the dashboard runs on `https://localhost:15888` and exposes telemetry, traces, and environment variables. What security controls exist by default, and what should be documented?

7. **`CONTRIBUTING.md` dev cert section** — is `dotnet dev-certs https --trust` safe advice? Any caveats for corporate/managed machines?

8. **Result<T> implicit operators** — any security implications of implicit casting from `T` to `Result<T>` and from `Error` to `Result<T>`? Could this lead to silent swallowing of errors?

---

### OWASP References Relevant to Foundation Layer
- **A06:2021 — Vulnerable and Outdated Components**: NuGet + npm packages
- **A02:2021 — Cryptographic Failures**: dev cert setup, HTTPS enforcement
- **A09:2021 — Security Logging and Monitoring Failures**: OTel setup in ServiceDefaults — is it complete?
- **A05:2021 — Security Misconfiguration**: `Directory.Build.props`, Aspire dashboard exposure

Please produce:
1. A threat-by-threat assessment
2. Any mandatory security fixes (blocking)
3. Any recommended security hardening items (non-blocking, but should be tracked)
4. Confirmation of whether this sprint is **APPROVED FOR IMPLEMENTATION** from a security standpoint

**Summary:** Architecture review complete — approved with mandatory fixes. Five must-fix items identified: IEquatable on Entity, DateTimeOffset on IDomainEvent, IUnitOfWork split from IRepository, HashCode.Add pattern for ValueObject, AppHost AC correction. Two recommended additions: non-generic Result type + Match method, IDomainEventContainer interface.

### State: Security Review [Security Auditor] (3m55s)
**Task:** 
## Performance Review — Sprint 1 Foundation Layer

Pre-implementation performance review for the SharedKernel DDD base types and Aspire scaffold. The focus is on identifying any algorithmic, allocation, or design-time performance decisions that will be expensive to fix once the base types are load-bearing across many feature slices.

---

### What Is Being Built

**SharedKernel DDD primitives (the subject of this review):**

```csharp
// Entity<TId> — base entity, identity equality
public abstract class Entity<TId> : IEquatable<Entity<TId>> where TId : notnull
{
    public TId Id { get; protected init; }
    protected Entity(TId id) => Id = id;
    public bool Equals(Entity<TId>? other) => other is not null && Id.Equals(other.Id);
    public override bool Equals(object? obj) => Equals(obj as Entity<TId>);
    public override int GetHashCode() => Id.GetHashCode();
    public static bool operator ==(Entity<TId>? a, Entity<TId>? b) => a?.Equals(b) ?? b is null;
    public static bool operator !=(Entity<TId>? a, Entity<TId>? b) => !(a == b);
}

// ValueObject — structural equality
public abstract class ValueObject
{
    protected abstract IEnumerable<object?> GetEqualityComponents();
    public override bool Equals(object? obj) =>
        obj?.GetType() == GetType() &&
        obj is ValueObject vo &&
        GetEqualityComponents().SequenceEqual(vo.GetEqualityComponents());
    public override int GetHashCode()
    {
        var hash = new HashCode();
        foreach (var component in GetEqualityComponents())
            hash.Add(component);
        return hash.ToHashCode();     // HashCode.Add() pattern (arch-review fix applied)
    }
    public static bool operator ==(ValueObject? a, ValueObject? b) => a?.Equals(b) ?? b is null;
    public static bool operator !=(ValueObject? a, ValueObject? b) => !(a == b);
}

// AggregateRoot<TId> — owns domain events
public abstract class AggregateRoot<TId> : Entity<TId>, IDomainEventContainer
    where TId : notnull
{
    private readonly List<IDomainEvent> _domainEvents = [];
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    protected AggregateRoot(TId id) : base(id) { }
    protected void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}

// IDomainEvent — plain marker interface
public interface IDomainEvent
{
    Guid EventId { get; }              // Guid.CreateVersion7() recommended
    DateTimeOffset OccurredOn { get; }
}

// IRepository<T, TId> — NO SaveChangesAsync
public interface IRepository<T, TId>
    where T : AggregateRoot<TId>
    where TId : notnull
{
    Task<T?> GetByIdAsync(TId id, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(TId id, CancellationToken ct = default);
}

// IUnitOfWork
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

// Result<T>
public sealed class Result<T>
{
    public T? Value { get; }
    public Error? Error { get; }
    public bool IsSuccess { get; }
    private Result(T value) { Value = value; IsSuccess = true; }
    private Result(Error error) { Error = error; IsSuccess = false; }
    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(Error error) => new(error);
    public static implicit operator Result<T>(T value) => Success(value);
    public static implicit operator Result<T>(Error error) => Failure(error);
    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<Error, TOut> onFailure) =>
        IsSuccess ? onSuccess(Value!) : onFailure(Error!);
}

// Result (non-generic, void operations)
public sealed class Result
{
    public Error? Error { get; }
    public bool IsSuccess { get; }
    private Result() { IsSuccess = true; }
    private Result(Error error) { Error = error; IsSuccess = false; }
    public static Result Success() => new();
    public static Result Failure(Error error) => new(error);
    public static implicit operator Result(Error error) => Failure(error);
    public TOut Match<TOut>(Func<TOut> onSuccess, Func<Error, TOut> onFailure) =>
        IsSuccess ? onSuccess() : onFailure(Error!);
}

// Error record (security-review fix applied: InternalDetail added)
public sealed record Error(string Code, string Message, string? InternalDetail = null)
{
    public static Error NotFound(string resource) =>
        new($"{resource}.NotFound", $"{resource} was not found.");
    public static Error Validation(string field, string reason) =>
        new($"{field}.Validation", reason);
    public static Error Conflict(string resource) =>
        new($"{resource}.Conflict", $"{resource} already exists.");
    public static Error Unexpected(string userMessage = "An unexpected error occurred.",
                                   string? internalDetail = null) =>
        new("Unexpected", userMessage, internalDetail);
}
```

---

### Performance Questions to Answer

1. **`Result<T>` allocation cost** — `Result<T>` is a reference type (`sealed class`). Every handler returns a new heap allocation. At high-throughput endpoints (hundreds of calls/sec), this adds GC pressure. Should `Result<T>` be a `readonly struct` instead? What are the trade-offs?

2. **`ValueObject.GetEqualityComponents()` allocation** — every `Equals()` call allocates an `IEnumerable<object?>` (typically via `yield return`). For hot paths (collection filtering, dictionary lookups), this could be significant. Any mitigation?

3. **`Entity<TId>.GetHashCode()`** — delegates to `Id.GetHashCode()`. If `TId` is `Guid`, `Guid.GetHashCode()` is fast. If `TId` is `string`, it walks the string. Any concerns?

4. **`AggregateRoot` domain event list** — `List<IDomainEvent>` allocated eagerly per aggregate instance even if no events are raised. For read-heavy aggregates, this is unnecessary overhead. Should it be lazily initialised?

5. **`DomainEvents` property** — `_domainEvents.AsReadOnly()` allocates a new `ReadOnlyCollection<T>` wrapper on every access. Should this be cached?

6. **`IReadOnlyList<IDomainEvent>` vs `IReadOnlyCollection<IDomainEvent>`** — any preference for the return type of `DomainEvents`?

7. **`SequenceEqual` in `ValueObject.Equals`** — O(n) comparison on every equality check. For complex ValueObjects with many components, this compounds. Is there a pattern to short-circuit early?

8. **`Guid.CreateVersion7()` for `IDomainEvent.EventId`** — performance comparison with `Guid.NewGuid()` and implications for sorted storage?

---

### Context
- This is a **foundation layer** — performance decisions here affect every slice in the application
- The application is not expected to handle > 1,000 req/sec initially, but the base types should not have obvious inefficiencies
- No benchmarks exist yet (no code exists); this is a design-time review
- BenchmarkDotNet will be available in test projects for future micro-benchmarks
- Target: .NET 9 (take advantage of any .NET 9-specific optimisations)

Please produce:
1. Performance assessment per question
2. Any mandatory performance fixes (blocking)
3. Recommended optimisations (non-blocking, noted for future)
4. **APPROVED / APPROVED WITH NOTES / BLOCKED** verdict

**Summary:** Security review complete — approved with mandatory fixes. Key items: Error record needs UserMessage/InternalDetail split, FluentAssertions pinned to v6.12.2, global.json rollForward:latestPatch, .gitignore must cover appsettings.*.json and user secrets, NuGet audit enabled. Guid.CreateVersion7() recommended for IDomainEvent.EventId.

### State: Performance Review [Performance Engineer] (2m8s)
**Task:** 
## UX Review — Sprint 1 Foundation Layer (Fast-Pass)

Sprint 1 contains **zero frontend or UI work**. The three items in scope are:
- item-001: Monorepo folder scaffold, package.json, .gitignore, .editorconfig, global.json, Directory.Build.props
- item-002: SharedKernel C# class library (DDD base types)
- item-003: .NET Aspire AppHost + ServiceDefaults

There is no React code, no components, no routes, no Storybook stories, no design system elements, and no user-facing UI of any kind in this sprint.

**Your task:**
1. Confirm this sprint has no UX deliverables
2. Note any UX/DX (developer experience) concerns about naming, folder conventions, or API ergonomics that could affect the component and page designs in future sprints (Sprint 3+ when the React app is built)
3. Note any Storybook or design system configuration decisions that should be made before the React scaffold begins in Sprint 2 (item-006)
4. Confirm **APPROVED — NO UX SCOPE THIS SPRINT**

Keep your response concise — this is a fast-pass review.

**Summary:** Performance review complete — approved with notes. DomainEvents property caching recommended (non-blocking), all other base types confirmed well-designed for target scale. No blocking performance issues.

### State: Ux Review [Ux Designer] (47s)
**Task:** 
## DevOps Review — Sprint 1 Foundation Layer

Pre-implementation operational readiness review for the monorepo scaffold, SharedKernel library, and Aspire AppHost. This sprint lays the build, packaging, and local orchestration foundation for the entire project. Review for CI/CD readiness, build configuration safety, secrets hygiene, deployment strategy, and developer onboarding correctness.

---

### What Is Being Built

**item-001 — Monorepo scaffold:**
```
adventure-engine/
├── apps/                          ← pnpm workspace "apps/*"
├── packages/                      ← pnpm workspace "packages/*"
├── package.json                   ← root, pnpm workspaces, placeholder scripts
├── pnpm-workspace.yaml
├── .gitignore
├── .nvmrc                         ← Node LTS (v22)
├── .editorconfig
├── global.json                    ← .NET 9 SDK, rollForward: latestPatch
├── Directory.Build.props          ← Nullable, ImplicitUsings, TreatWarningsAsErrors
├── Directory.Packages.props       ← CPM, NuGetAudit: true, moderate
├── README.md                      ← placeholder
└── AdventureEngine.sln
```

**item-002 — SharedKernel:**
```
packages/
├── SharedKernel/
│   ├── SharedKernel.csproj        ← net9.0, class library
│   └── src/
│       ├── Primitives/            ← Entity<TId>, ValueObject, AggregateRoot<TId>, IDomainEvent
│       ├── Repositories/          ← IRepository<T,TId>, IUnitOfWork
│       └── Results/               ← Result<T>, Result, Error
└── SharedKernel.Tests/
    ├── SharedKernel.Tests.csproj  ← net9.0, xUnit, FluentAssertions v6.12.2, NSubstitute
    └── ...
```

**item-003 — Aspire AppHost + ServiceDefaults:**
```
apps/
└── AppHost/
    ├── AppHost.csproj             ← Aspire.Hosting.AppHost SDK, net9.0
    └── Program.cs                 ← DistributedApplication.CreateBuilder(args).Build().Run()

packages/
└── ServiceDefaults/
    ├── ServiceDefaults.csproj     ← net9.0
    └── Extensions.cs             ← AddServiceDefaults(): OTel, health checks, resilience, service discovery
```

**Solution file will contain:**
- `packages/SharedKernel/SharedKernel.csproj`
- `packages/SharedKernel.Tests/SharedKernel.Tests.csproj`
- `apps/AppHost/AppHost.csproj`
- `packages/ServiceDefaults/ServiceDefaults.csproj`

---

### Architecture decisions already locked

1. **global.json:** `"rollForward": "latestPatch"` — allows .NET 9 security patches without lockfile update
2. **Directory.Build.props:** `TreatWarningsAsErrors=true` globally (with Aspire-specific suppressions needed)
3. **Directory.Packages.props:** CPM enabled; `<NuGetAudit>true</NuGetAudit>` + `<NuGetAuditLevel>moderate</NuGetAuditLevel>`
4. **FluentAssertions:** Pinned to `v6.12.2` (Apache 2.0 license)
5. **OpenAPI:** Built-in .NET 9 (not relevant this sprint; API is Sprint 2)
6. **Aspire dashboard:** localhost only, protected by browser token in Aspire 8+ — dev only, never exposed externally

---

### Questions to Answer

#### Build System

1. **`dotnet build` from repo root** — when a `.sln` file exists at root, `dotnet build` builds all projects in the solution. Will this work correctly with the proposed project layout (`apps/` and `packages/` subdirectories)?

2. **`TreatWarningsAsErrors=true` in `Directory.Build.props`** — this applies to ALL projects including Aspire's SDK. The Aspire AppHost SDK is known to emit analyzer warnings in some configurations (e.g., `ASPIRE001`, `AZPROVISION001`). What specific warning suppression codes should be added to `Directory.Build.props` or `AppHost.csproj` to prevent build failures?

3. **`Directory.Packages.props` — CPM with Aspire packages** — the Aspire SDK has a feature called "Aspire-managed package versions" where the Aspire workload updates its component packages together. Does CPM conflict with Aspire's version management strategy? How should this be handled?

4. **`dotnet test` from repo root** — will `dotnet test AdventureEngine.sln` discover `SharedKernel.Tests` correctly? Are there any test project configuration quirks with net9.0 + xUnit 3 (or xUnit 2.x) that need to be addressed?

#### Secrets and Configuration

5. **Aspire AppHost configuration** — even a minimal AppHost may emit environment variables or connection strings into its managed environment. What files/patterns must be in `.gitignore` to prevent accidental secrets commits from Aspire's local state?

6. **`.env.example` scope** — item-011 (Sprint 5) creates `.env.example`. For Sprint 1, are there any environment variables that need to be documented NOW (e.g., `ASPNETCORE_ENVIRONMENT`, `DOTNET_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS`)? Should a minimal `.env.example` stub be created in item-001?

#### CI/CD Readiness

7. **GitHub Actions workflow (item-016, Sprint 5)** — what commands must the Sprint 1 foundation enable for a minimal CI pipeline? Specifically:
   - `dotnet restore --locked-mode` — is there a NuGet lock file generated by default with CPM?
   - `dotnet build --no-restore -c Release` — any flags needed for Aspire AppHost projects?
   - `dotnet test --no-build -c Release --logger trx` — correct invocation?
   - `pnpm install --frozen-lockfile` — does this work before the React app exists (Sprint 2)?

8. **NuGet restore lock file** — should `<RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>` be added to `Directory.Build.props` now? This generates `packages.lock.json` per project. Combined with `--locked-mode` in CI, it prevents dependency drift. Any downsides?

#### Aspire-Specific Concerns

9. **AppHost minimal Program.cs** — `DistributedApplication.CreateBuilder(args).Build().Run()` with no resources registered. Does Aspire complain or error when no resources are added to the AppHost? Is an empty AppHost a valid state?

10. **`CONTRIBUTING.md` port table** — the following ports need to be documented. Are any of these known to conflict with common developer tooling?
    - Aspire Dashboard: `15888` (HTTPS)
    - API HTTP: `5000` / HTTPS: `5001` (Sprint 2)
    - Vite dev server: `5173` (Sprint 2)
    - Storybook: `6006` (Sprint 3)

11. **`dotnet workload install aspire`** — should the version of the Aspire workload be pinned (e.g. via a `dotnet-tools.json` or workload manifest)? How does the team ensure consistent Aspire workload versions across developer machines and CI?

#### Migration of Existing Files

12. **Existing `package.json` conflict** — the repo currently has a `package.json` (Pi tooling, name: `adventure-engine`) with `node_modules/` and `package-lock.json` (npm, not pnpm). During item-001, this must be migrated. What is the correct sequence?
    - Delete `package-lock.json` (npm lockfile)
    - Update `package.json` to add `"packageManager": "pnpm@x.x.x"`, `"workspaces"`, and monorepo scripts
    - Move Pi tooling dependencies into the root `package.json` devDependencies or into a `packages/pi-tools/` sub-package
    - Run `pnpm install` to generate `pnpm-lock.yaml`

---

### Context
- Target CI: GitHub Actions (item-016, Sprint 5)
- Package manager: pnpm (monorepo)
- .NET: 9 LTS
- Aspire version: latest stable (9.x)
- No Docker in this sprint (item-012, Sprint 5)
- No secrets or external services in this sprint

Please produce:
1. Answers to all 12 questions with concrete recommendations
2. Any mandatory DevOps fixes (blocking implementation)
3. Recommended additions to `Directory.Build.props`, `.gitignore`, and `CONTRIBUTING.md`
4. **APPROVED / APPROVED WITH NOTES / BLOCKED** verdict

**Summary:** UX fast-pass complete — zero UI scope confirmed. Five DX forward-looking notes captured for Sprint 2/3 (design tokens in item-006, component file structure convention, port table in CONTRIBUTING.md, Storybook version decision, shared component library decision).

### State: Devops Review [Devops Engineer] (2m57s)
**Task:** 
## Plan Approval Gate — Sprint 1 Foundation Layer

You are the final gatekeeper before implementation begins. Four specialist panels (Architecture, Security, Performance, DevOps) have reviewed the Sprint 1 increment. A UX fast-pass was also completed. Your job is to:

1. Synthesize all review findings into a single, definitive mandatory-fixes list
2. Challenge any assumptions or conflicts between the reviews
3. Produce a complete, self-contained implementation brief that the builder can execute without needing to re-read any prior review output
4. **APPROVE or BLOCK** the sprint

---

## Review Panel Findings Summary

### Architecture Review — Mandatory Fixes
| # | Fix | Location |
|---|---|---|
| A1 | `Entity<TId>` must implement `IEquatable<Entity<TId>>` | `packages/SharedKernel/src/Primitives/Entity.cs` |
| A2 | `IDomainEvent.OccurredOn` must be `DateTimeOffset` (not `DateTime`) | `packages/SharedKernel/src/Primitives/IDomainEvent.cs` |
| A3 | `IRepository<T,TId>` must NOT contain `SaveChangesAsync` — split to `IUnitOfWork` interface | `packages/SharedKernel/src/Repositories/` |
| A4 | `ValueObject.GetHashCode()` must use `HashCode.Add()` pattern, not `HashCode.Combine` via `Aggregate` | `packages/SharedKernel/src/Primitives/ValueObject.cs` |
| A5 | `backlog.json` item-003 AC must remove `AddProject<>()` reference (API doesn't exist until Sprint 2) | `backlog.json` |

### Architecture Review — Recommendations (implement unless blocked)
| # | Recommendation | Location |
|---|---|---|
| AR1 | Add non-generic `Result` type for void operations | `packages/SharedKernel/src/Results/Result.cs` |
| AR2 | Add `Match<TOut>()` method to both `Result<T>` and `Result` for exhaustive handling | Same |
| AR3 | Add `IDomainEventContainer` interface so infrastructure can type-safely access events | `packages/SharedKernel/src/Primitives/IDomainEventContainer.cs` |
| AR4 | Use `Guid.CreateVersion7()` for `IDomainEvent.EventId` (sequential, B-tree friendly) | Concrete implementations |

### Security Review — Mandatory Fixes
| # | Fix | Location |
|---|---|---|
| S1 | `Error` record must have `UserMessage` + `InternalDetail` split: `Error(Code, Message, InternalDetail?)` | `packages/SharedKernel/src/Results/Error.cs` |
| S2 | `Error.Unexpected()` factory must default to `"An unexpected error occurred."` and accept optional `internalDetail` | Same |
| S3 | `FluentAssertions` must be pinned to exactly `6.12.2` (last Apache 2.0 release) | `Directory.Packages.props` |
| S4 | `global.json` must use `"rollForward": "latestPatch"` | `global.json` |
| S5 | npm `yaml` package must be pinned exactly (no `^` range specifier) | `package.json` |
| S6 | `.gitignore` must cover: `appsettings.*.json` (except base), `.env` variants, `.aspire/`, `launchSettings.json`, `*.user`, `UserSecrets` paths | `.gitignore` |

### Security Review — Recommendations
| # | Recommendation |
|---|---|
| SR1 | `NuGetAudit` enabled in `Directory.Packages.props`: `<NuGetAudit>true</NuGetAudit>` + `<NuGetAuditLevel>moderate</NuGetAuditLevel>` |
| SR2 | Document Aspire dashboard dev-only nature + browser token behaviour in `CONTRIBUTING.md` |
| SR3 | Add `dotnet list package --vulnerable` to item-016 CI pipeline AC (Sprint 5) |

### Performance Review — Recommendations (non-blocking)
| # | Recommendation | Location |
|---|---|---|
| P1 | Cache `ReadOnlyCollection<T>` wrapper in `AggregateRoot.DomainEvents`: `_domainEventsReadOnly ??= _domainEvents.AsReadOnly()` | `packages/SharedKernel/src/Primitives/AggregateRoot.cs` |
| P2 | Add `[MethodImpl(MethodImplOptions.AggressiveInlining)]` to `Result<T>.Match()` and `Result.Match()` | `packages/SharedKernel/src/Results/Result.cs` |

### DevOps Review — Mandatory Fixes
| # | Fix | Location |
|---|---|---|
| D1 | `backlog.json` item-003 AC: remove `AddProject<>()` (same as A5) | `backlog.json` |
| D2 | `package.json` must have `"packageManager": "pnpm@10.x.x"` field | `package.json` |
| D3 | `package-lock.json` must be deleted; `pnpm-lock.yaml` generated | item-001 execution |
| D4 | `Directory.Build.props` must add `<RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>` | `Directory.Build.props` |
| D5 | `apps/AppHost/AppHost.csproj` must add `<NoWarn>$(NoWarn);ASPIRE001</NoWarn>` | `AppHost.csproj` |
| D6 | Aspire workload-managed packages must NOT be versioned in `Directory.Packages.props` | `Directory.Packages.props` |

### DevOps Review — Recommendations
| # | Recommendation |
|---|---|
| DR1 | `CONTRIBUTING.md` port table: Aspire:15888, API HTTP:5000/HTTPS:5001, Vite:5173, Storybook:6006 |
| DR2 | Document `dotnet test --logger trx --results-directory ./TestResults` as canonical CI command |
| DR3 | Document Aspire workload version in CONTRIBUTING.md prerequisites section |

### UX/DX Fast-Pass — Forward-Looking Notes (Sprint 2/3)
- Design tokens must be wired from day one in item-006 (Sprint 2)
- Component file structure convention to be documented in `CONTRIBUTING.md` during item-003
- Storybook version (7 vs 8) must be decided before item-006 scaffolds

---

## Implementation File Structure (authoritative)

```
adventure-engine/
├── apps/
│   └── AppHost/
│       ├── AppHost.csproj                    ← Aspire.Hosting.AppHost SDK, net9.0, NoWarn ASPIRE001
│       └── Program.cs                        ← minimal, NO AddProject<>()
├── packages/
│   ├── SharedKernel/
│   │   ├── SharedKernel.csproj               ← net9.0 class library
│   │   └── src/
│   │       ├── Primitives/
│   │       │   ├── Entity.cs                 ← Entity<TId> : IEquatable<Entity<TId>>
│   │       │   ├── ValueObject.cs            ← HashCode.Add() pattern
│   │       │   ├── AggregateRoot.cs          ← IDomainEventContainer, cached ReadOnlyCollection
│   │       │   ├── IDomainEventContainer.cs  ← interface for infrastructure access
│   │       │   └── IDomainEvent.cs           ← DateTimeOffset OccurredOn, Guid.CreateVersion7()
│   │       ├── Repositories/
│   │       │   ├── IRepository.cs            ← NO SaveChangesAsync
│   │       │   └── IUnitOfWork.cs            ← Task<int> SaveChangesAsync(CancellationToken)
│   │       └── Results/
│   │           ├── Result.cs                 ← Result<T> + non-generic Result, both with Match<TOut>()
│   │           └── Error.cs                  ← record Error(Code, Message, InternalDetail?)
│   ├── SharedKernel.Tests/
│   │   ├── SharedKernel.Tests.csproj         ← xUnit, FluentAssertions 6.12.2, NSubstitute
│   │   └── ...test files...
│   └── ServiceDefaults/
│       ├── ServiceDefaults.csproj            ← net9.0
│       └── Extensions.cs                    ← AddServiceDefaults()
├── package.json                              ← pnpm workspaces, "packageManager": "pnpm@10.x.x"
├── pnpm-workspace.yaml
├── pnpm-lock.yaml                            ← generated, committed
├── .gitignore                                ← covers appsettings.*.json, .env, .aspire/, *.user
├── .nvmrc                                    ← 22
├── .editorconfig
├── global.json                               ← .NET 9 SDK, rollForward: latestPatch
├── Directory.Build.props                     ← Nullable, ImplicitUsings, TreatWarningsAsErrors, RestorePackagesWithLockFile
├── Directory.Packages.props                  ← CPM, NuGetAudit, pinned non-Aspire packages only
├── AdventureEngine.sln                       ← all 4 projects
├── CONTRIBUTING.md                           ← prerequisites, port table, dev cert, test commands
└── README.md                                 ← placeholder
```

---

## Your Tasks

1. **Read `backlog.json`** — verify item-003's AC has the `AddProject<>()` reference that needs removing. Fix it directly.

2. **Challenge and validate** the combined mandatory-fixes list. Are there any conflicts between reviews? Anything missing? Anything that should NOT be implemented (over-engineering)?

3. **Confirm or override** the recommended items — which recommendations should be elevated to mandatory for this sprint?

4. **Produce the final implementation brief** — a single, ordered task list that the builder can execute top-to-bottom. Include exact file names, interface signatures, class structures, and configuration values. This must be the single source of truth; the builder will not re-read review outputs.

5. **Declare APPROVED or BLOCKED** with rationale.

---

## Constraints
- No MediatR, no EF Core, no HTTP, no frontend — this sprint is .NET foundations only
- Application name: AdventureEngine
- All namespaces: `AdventureEngine.*`
- Target framework: `net9.0`
- pnpm version to pin: check what is installed or use `10.0.0` as a safe minimum

**Summary:** DevOps review complete — approved with mandatory fixes. Five blocking items: item-003 backlog AC correction, package-lock.json deletion, packageManager field in package.json, RestorePackagesWithLockFile in Directory.Build.props, AppHost.csproj ASPIRE001 suppression. Aspire workload not currently installed on this machine.

### State: Plan Approval [Plan Reviewer] (2m32s)
**Task:** 
# Sprint 1 — Implementation Brief (Authoritative)

You are the builder. This brief is the **single source of truth**. Do not re-read prior review documents. Execute every task below in the exact order given. All architectural, security, performance, and DevOps decisions have been finalised by the review panel.

---

## 0. Pre-Implementation Fixes (Do These First)

### 0a. Update `.pi/project.json`
The file currently has stale values. Update it to reflect the real project:
```json
{
  "language": "TypeScript, C#",
  "framework": "React, ASP.NET Core, .NET Aspire",
  "runtime": "Node.js, .NET 9",
  "architecture": {
    "pattern": "Vertical Slice Architecture wrapping Clean Architecture + DDD",
    "notes": "Feature slices in apps/Api/Features/<Name>/. SharedKernel in packages/SharedKernel/. No MediatR."
  },
  "testing": {
    "framework": "vitest, xunit",
    "tdd": true
  }
}
```

### 0b. Fix `backlog.json` item-003 acceptance criteria
Find item `item-003` in `backlog.json`. Replace any AC that references `AddProject<>()` or implies the API project exists with:
- `"Given the AppHost project, when dotnet run --project apps/AppHost is executed, then the .NET Aspire dashboard is accessible at https://localhost:15888 (HTTPS, protected by Aspire browser token)"`
- Remove any reference to `AddProject<>()` or API placeholder from this sprint's ACs.

### 0c. Fix `backlog.json` item-002 acceptance criteria
Find item `item-002`. Replace any AC that describes:
- `IDomainEvent` as an "abstract record" → it is a **plain marker interface** (no abstract, no record)
- Repository methods as `Find`, `Add`, `Update`, `Remove` → they are `GetByIdAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync`
Add missing ACs for: `IUnitOfWork` (non-generic, `SaveChangesAsync`), `IDomainEventContainer` interface, non-generic `Result` type.

---

## 1. item-001 — Monorepo Scaffold

### 1a. Root `package.json`
Update (do NOT replace wholesale — preserve existing `devDependencies` such as `yaml`) the root `package.json`:
```json
{
  "name": "adventure-engine",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "start": "echo 'Run: dotnet run --project apps/AppHost'",
    "test": "echo 'Frontend tests: add in Sprint 2'",
    "test:e2e": "echo 'E2E tests: add in Sprint 3'",
    "test:api": "dotnet test AdventureEngine.sln --no-build -c Release --logger trx --results-directory ./TestResults",
    "storybook": "echo 'Storybook: add in Sprint 3'",
    "build": "echo 'Build: add in Sprint 2'"
  },
  "devDependencies": {
    "yaml": "2.8.0"
  }
}
```
> Note: preserve the exact existing `yaml` version from the current `package.json` (check exact version). Pin it exactly (no `^`). Keep any other existing devDependencies.

### 1b. `pnpm-workspace.yaml`
Create at repo root:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 1c. Delete `package-lock.json`
Delete the existing `package-lock.json` (npm lockfile). It will be replaced by `pnpm-lock.yaml`.

### 1d. Run pnpm install
```bash
pnpm install
```
This generates `pnpm-lock.yaml`. Verify it is created.

### 1e. Create `apps/` and `packages/` directories
```bash
mkdir -p apps packages
```
Add a `.gitkeep` file in each if they remain empty after this sprint (they won't — AppHost goes in `apps/`, SharedKernel in `packages/`).

### 1f. `.gitignore`
Create `.gitignore` at repo root with these sections:

```gitignore
# Node
node_modules/
dist/
build/
.turbo/

# pnpm
.pnpm-store/

# Environment
.env
.env.local
.env.*.local
!.env.example

# .NET
bin/
obj/
*.user
*.suo
.vs/
.vscode/settings.json
TestResults/
*.trx

# .NET User Secrets (never commit)
# Windows: %APPDATA%/Microsoft/UserSecrets
# macOS/Linux: ~/.microsoft/usersecrets

# ASP.NET Core / Aspire
appsettings.Development.json
appsettings.*.json
!appsettings.json
launchSettings.json
.aspire/

# NuGet
*.nupkg
packages.lock.json
# DO NOT add packages.lock.json here — it should be committed for --locked-mode CI

# macOS
.DS_Store
.AppleDouble
.LSOverride

# JetBrains
.idea/
*.iml

# VS Code (keep shared settings, ignore user settings)
.vscode/
!.vscode/extensions.json
!.vscode/settings.json.template
```

> ⚠️ Important: `packages.lock.json` files (NuGet restore lock files) should **NOT** be gitignored — they must be committed for `dotnet restore --locked-mode` to work in CI.

### 1g. `.nvmrc`
```
22
```

### 1h. `.editorconfig`
```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{cs,csx}]
indent_size = 4

[*.{csproj,props,targets}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

### 1i. `global.json`
```json
{
  "sdk": {
    "version": "9.0.100",
    "rollForward": "latestPatch"
  }
}
```
> Check the installed .NET 9 SDK version with `dotnet --version` and use the actual installed version.

### 1j. `Directory.Build.props`
```xml
<Project>
  <PropertyGroup>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <WarningsAsErrors />
    <LangVersion>latest</LangVersion>
    <RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
</Project>
```

### 1k. `Directory.Packages.props`
```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
    <NuGetAudit>true</NuGetAudit>
    <NuGetAuditLevel>moderate</NuGetAuditLevel>
  </PropertyGroup>

  <ItemGroup Label="Test">
    <PackageVersion Include="xunit" Version="2.9.2" />
    <PackageVersion Include="xunit.runner.visualstudio" Version="2.8.2" />
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
    <PackageVersion Include="FluentAssertions" Version="6.12.2" />
    <PackageVersion Include="NSubstitute" Version="5.3.0" />
    <PackageVersion Include="coverlet.collector" Version="6.0.2" />
  </ItemGroup>

  <!-- Aspire workload-managed packages: do NOT pin versions here.
       The Aspire workload manages these through its own version manifest.
       List the package names only for IDE discoverability; leave Version empty
       or omit from this file entirely. -->
</Project>
```

### 1l. Create the solution file
```bash
dotnet new sln --name AdventureEngine
```

### 1m. `README.md`
```markdown
# AdventureEngine

> Getting started instructions coming in Sprint 5 (item-013).

## Prerequisites

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions.
```

---

## 2. item-002 — SharedKernel

### 2a. Create the project
```bash
dotnet new classlib -n AdventureEngine.SharedKernel -o packages/SharedKernel --framework net9.0
dotnet sln AdventureEngine.sln add packages/SharedKernel/AdventureEngine.SharedKernel.csproj
```

Delete the default `Class1.cs`.

Edit `packages/SharedKernel/AdventureEngine.SharedKernel.csproj`:
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <RootNamespace>AdventureEngine.SharedKernel</RootNamespace>
    <AssemblyName>AdventureEngine.SharedKernel</AssemblyName>
  </PropertyGroup>
</Project>
```

### 2b. Create folder structure
```
packages/SharedKernel/src/
  Primitives/
  Repositories/
  Results/
```

### 2c. `src/Primitives/Entity.cs`
```csharp
namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Base class for all domain entities. Equality is determined by identity (Id), not structure.
/// </summary>
public abstract class Entity<TId> : IEquatable<Entity<TId>>
    where TId : notnull
{
    public TId Id { get; protected init; }

    protected Entity(TId id)
    {
        Id = id;
    }

    public bool Equals(Entity<TId>? other)
        => other is not null && Id.Equals(other.Id);

    public override bool Equals(object? obj)
        => Equals(obj as Entity<TId>);

    public override int GetHashCode()
        => Id.GetHashCode();

    public static bool operator ==(Entity<TId>? left, Entity<TId>? right)
        => left?.Equals(right) ?? right is null;

    public static bool operator !=(Entity<TId>? left, Entity<TId>? right)
        => !(left == right);
}
```

### 2d. `src/Primitives/ValueObject.cs`
```csharp
namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Base class for value objects. Equality is structural — determined by component values.
/// </summary>
public abstract class ValueObject
{
    /// <summary>
    /// Returns the components used for equality comparison.
    /// Implementors should use <c>yield return</c> for each significant field.
    /// </summary>
    protected abstract IEnumerable<object?> GetEqualityComponents();

    public override bool Equals(object? obj)
    {
        if (obj?.GetType() != GetType()) return false;
        if (obj is not ValueObject other) return false;
        return GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }

    public override int GetHashCode()
    {
        var hash = new HashCode();
        foreach (var component in GetEqualityComponents())
            hash.Add(component);
        return hash.ToHashCode();
    }

    public static bool operator ==(ValueObject? left, ValueObject? right)
        => left?.Equals(right) ?? right is null;

    public static bool operator !=(ValueObject? left, ValueObject? right)
        => !(left == right);
}
```

### 2e. `src/Primitives/IDomainEvent.cs`
```csharp
namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Marker interface for domain events. No MediatR dependency.
/// Implementors should use <c>Guid.CreateVersion7()</c> for <see cref="EventId"/>
/// to ensure monotonically increasing, B-tree-friendly identifiers.
/// </summary>
public interface IDomainEvent
{
    /// <summary>A unique, ordered identifier for this event instance.</summary>
    Guid EventId { get; }

    /// <summary>The UTC instant at which the event occurred.</summary>
    DateTimeOffset OccurredOn { get; }
}
```

### 2f. `src/Primitives/IDomainEventContainer.cs`
```csharp
namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Exposes the domain event list to infrastructure layers (e.g. EF Core interceptors,
/// post-save dispatchers). Not intended to be called by application or domain code.
/// </summary>
public interface IDomainEventContainer
{
    IReadOnlyList<IDomainEvent> DomainEvents { get; }
    void ClearDomainEvents();
}
```

### 2g. `src/Primitives/AggregateRoot.cs`
```csharp
using System.Collections.ObjectModel;
using System.Runtime.CompilerServices;

namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Base class for aggregate roots. Owns and raises domain events.
/// </summary>
public abstract class AggregateRoot<TId> : Entity<TId>, IDomainEventContainer
    where TId : notnull
{
    private readonly List<IDomainEvent> _domainEvents = [];
    private ReadOnlyCollection<IDomainEvent>? _domainEventsReadOnly;

    protected AggregateRoot(TId id) : base(id) { }

    /// <inheritdoc />
    public IReadOnlyList<IDomainEvent> DomainEvents
        => _domainEventsReadOnly ??= _domainEvents.AsReadOnly();

    /// <summary>Raises a domain event from within the aggregate.</summary>
    protected void AddDomainEvent(IDomainEvent domainEvent)
        => _domainEvents.Add(domainEvent);

    /// <inheritdoc />
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
        _domainEventsReadOnly = null; // invalidate cache after clear
    }
}
```

### 2h. `src/Repositories/IRepository.cs`
```csharp
using AdventureEngine.SharedKernel.Primitives;

namespace AdventureEngine.SharedKernel.Repositories;

/// <summary>
/// Generic repository abstraction for aggregate roots.
/// Does NOT include SaveChangesAsync — use <see cref="IUnitOfWork"/> for that.
/// </summary>
public interface IRepository<T, TId>
    where T : AggregateRoot<TId>
    where TId : notnull
{
    Task<T?> GetByIdAsync(TId id, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(TId id, CancellationToken ct = default);
}
```

### 2i. `src/Repositories/IUnitOfWork.cs`
```csharp
namespace AdventureEngine.SharedKernel.Repositories;

/// <summary>
/// Abstraction for committing a unit of work. Decoupled from individual repositories
/// to support multi-aggregate transactions within a single use case.
/// </summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
```

### 2j. `src/Results/Error.cs`
```csharp
namespace AdventureEngine.SharedKernel.Results;

/// <summary>
/// Represents a domain or application error.
/// <para>
/// <b>SECURITY:</b> <see cref="Message"/> is safe to surface to API consumers.
/// <see cref="InternalDetail"/> must NEVER leave the service boundary — log it only.
/// </para>
/// </summary>
public sealed record Error(string Code, string Message, string? InternalDetail = null)
{
    /// <summary>The resource was not found.</summary>
    public static Error NotFound(string resource)
        => new($"{resource}.NotFound", $"{resource} was not found.");

    /// <summary>A field failed validation.</summary>
    public static Error Validation(string field, string reason)
        => new($"{field}.Validation", reason);

    /// <summary>A resource conflict occurred (e.g. duplicate).</summary>
    public static Error Conflict(string resource)
        => new($"{resource}.Conflict", $"{resource} already exists.");

    /// <summary>
    /// An unexpected error occurred.
    /// Pass <paramref name="internalDetail"/> for structured logging;
    /// it will NOT be sent to API consumers.
    /// </summary>
    public static Error Unexpected(
        string userMessage = "An unexpected error occurred.",
        string? internalDetail = null)
        => new("Unexpected", userMessage, internalDetail);
}
```

### 2k. `src/Results/Result.cs`
```csharp
using System.Runtime.CompilerServices;
using AdventureEngine.SharedKernel.Results;

namespace AdventureEngine.SharedKernel.Results;

/// <summary>Generic result wrapping a value or an error. Use for operations that return data.</summary>
public sealed class Result<T>
{
    public T? Value { get; }
    public Error? Error { get; }
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    private Result(T value)  { Value = value;  IsSuccess = true;  }
    private Result(Error error) { Error = error; IsSuccess = false; }

    public static Result<T> Success(T value)   => new(value);
    public static Result<T> Failure(Error error) => new(error);

    public static implicit operator Result<T>(T value)   => Success(value);
    public static implicit operator Result<T>(Error error) => Failure(error);

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<Error, TOut> onFailure)
        => IsSuccess ? onSuccess(Value!) : onFailure(Error!);
}

/// <summary>Non-generic result for void operations. Use when no return value is needed.</summary>
public sealed class Result
{
    public Error? Error { get; }
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    private Result()           { IsSuccess = true;  }
    private Result(Error error) { Error = error; IsSuccess = false; }

    public static Result Success()             => new();
    public static Result Failure(Error error)  => new(error);

    public static implicit operator Result(Error error) => Failure(error);

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public TOut Match<TOut>(Func<TOut> onSuccess, Func<Error, TOut> onFailure)
        => IsSuccess ? onSuccess() : onFailure(Error!);
}
```

### 2l. Create the xUnit test project
```bash
dotnet new xunit -n AdventureEngine.SharedKernel.Tests -o packages/SharedKernel.Tests --framework net9.0
dotnet sln AdventureEngine.sln add packages/SharedKernel.Tests/AdventureEngine.SharedKernel.Tests.csproj
```

Edit `packages/SharedKernel.Tests/AdventureEngine.SharedKernel.Tests.csproj`:
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <RootNamespace>AdventureEngine.SharedKernel.Tests</RootNamespace>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="xunit" />
    <PackageReference Include="xunit.runner.visualstudio" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
    <PackageReference Include="FluentAssertions" />
    <PackageReference Include="NSubstitute" />
    <PackageReference Include="coverlet.collector" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="../SharedKernel/AdventureEngine.SharedKernel.csproj" />
  </ItemGroup>
</Project>
```

### 2m. Write the tests

Create `packages/SharedKernel.Tests/Primitives/EntityTests.cs`:
```csharp
using AdventureEngine.SharedKernel.Primitives;
using FluentAssertions;

namespace AdventureEngine.SharedKernel.Tests.Primitives;

public sealed class EntityTests
{
    private sealed class TestEntity(Guid id) : Entity<Guid>(id);

    [Fact]
    public void Entities_WithSameId_AreEqual()
    {
        var id = Guid.NewGuid();
        var a = new TestEntity(id);
        var b = new TestEntity(id);
        a.Should().Be(b);
        (a == b).Should().BeTrue();
    }

    [Fact]
    public void Entities_WithDifferentIds_AreNotEqual()
    {
        var a = new TestEntity(Guid.NewGuid());
        var b = new TestEntity(Guid.NewGuid());
        a.Should().NotBe(b);
        (a != b).Should().BeTrue();
    }

    [Fact]
    public void Entity_GetHashCode_IsBasedOnId()
    {
        var id = Guid.NewGuid();
        var entity = new TestEntity(id);
        entity.GetHashCode().Should().Be(id.GetHashCode());
    }

    [Fact]
    public void Entity_ImplementsIEquatable()
    {
        typeof(TestEntity).Should().Implement(typeof(IEquatable<Entity<Guid>>));
    }
}
```

Create `packages/SharedKernel.Tests/Primitives/ValueObjectTests.cs`:
```csharp
using AdventureEngine.SharedKernel.Primitives;
using FluentAssertions;

namespace AdventureEngine.SharedKernel.Tests.Primitives;

public sealed class ValueObjectTests
{
    private sealed class Money(decimal amount, string currency) : ValueObject
    {
        protected override IEnumerable<object?> GetEqualityComponents()
        {
            yield return amount;
            yield return currency;
        }
    }

    [Fact]
    public void ValueObjects_WithSameComponents_AreEqual()
    {
        var a = new Money(10.00m, "USD");
        var b = new Money(10.00m, "USD");
        a.Should().Be(b);
        (a == b).Should().BeTrue();
    }

    [Fact]
    public void ValueObjects_WithDifferentComponents_AreNotEqual()
    {
        var a = new Money(10.00m, "USD");
        var b = new Money(10.00m, "EUR");
        a.Should().NotBe(b);
        (a != b).Should().BeTrue();
    }

    [Fact]
    public void ValueObject_GetHashCode_IsConsistent()
    {
        var money = new Money(10.00m, "USD");
        money.GetHashCode().Should().Be(money.GetHashCode());
    }

    [Fact]
    public void ValueObjects_WithSameComponents_HaveSameHashCode()
    {
        var a = new Money(10.00m, "USD");
        var b = new Money(10.00m, "USD");
        a.GetHashCode().Should().Be(b.GetHashCode());
    }
}
```

Create `packages/SharedKernel.Tests/Primitives/AggregateRootTests.cs`:
```csharp
using AdventureEngine.SharedKernel.Primitives;
using FluentAssertions;

namespace AdventureEngine.SharedKernel.Tests.Primitives;

public sealed class AggregateRootTests
{
    private sealed record TestEvent(Guid EventId, DateTimeOffset OccurredOn) : IDomainEvent;

    private sealed class TestAggregate(Guid id) : AggregateRoot<Guid>(id)
    {
        public void RaiseTestEvent()
            => AddDomainEvent(new TestEvent(Guid.CreateVersion7(), DateTimeOffset.UtcNow));
    }

    [Fact]
    public void NewAggregate_HasNoDomainEvents()
    {
        var aggregate = new TestAggregate(Guid.NewGuid());
        aggregate.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void RaisingEvent_AddsToDomainEvents()
    {
        var aggregate = new TestAggregate(Guid.NewGuid());
        aggregate.RaiseTestEvent();
        aggregate.DomainEvents.Should().HaveCount(1);
    }

    [Fact]
    public void ClearDomainEvents_RemovesAllEvents()
    {
        var aggregate = new TestAggregate(Guid.NewGuid());
        aggregate.RaiseTestEvent();
        aggregate.RaiseTestEvent();
        aggregate.ClearDomainEvents();
        aggregate.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void DomainEvents_ReturnsCachedReadOnlyWrapper()
    {
        var aggregate = new TestAggregate(Guid.NewGuid());
        var first = aggregate.DomainEvents;
        var second = aggregate.DomainEvents;
        first.Should().BeSameAs(second);
    }

    [Fact]
    public void AggregateRoot_ImplementsIDomainEventContainer()
    {
        typeof(TestAggregate).Should().Implement(typeof(IDomainEventContainer));
    }
}
```

Create `packages/SharedKernel.Tests/Results/ResultTests.cs`:
```csharp
using AdventureEngine.SharedKernel.Results;
using FluentAssertions;

namespace AdventureEngine.SharedKernel.Tests.Results;

public sealed class ResultTests
{
    [Fact]
    public void Success_Result_IsSuccess()
    {
        var result = Result<int>.Success(42);
        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Value.Should().Be(42);
        result.Error.Should().BeNull();
    }

    [Fact]
    public void Failure_Result_IsFailure()
    {
        var error = Error.NotFound("User");
        var result = Result<int>.Failure(error);
        result.IsFailure.Should().BeTrue();
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(error);
    }

    [Fact]
    public void ImplicitOperator_FromValue_CreatesSuccess()
    {
        Result<string> result = "hello";
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("hello");
    }

    [Fact]
    public void ImplicitOperator_FromError_CreatesFailure()
    {
        Result<string> result = Error.NotFound("Item");
        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public void Match_OnSuccess_CallsOnSuccess()
    {
        var result = Result<int>.Success(10);
        var output = result.Match(v => v * 2, _ => -1);
        output.Should().Be(20);
    }

    [Fact]
    public void Match_OnFailure_CallsOnFailure()
    {
        var result = Result<int>.Failure(Error.Unexpected());
        var output = result.Match(_ => 1, _ => -1);
        output.Should().Be(-1);
    }

    [Fact]
    public void NonGenericResult_Success_IsSuccess()
    {
        var result = Result.Success();
        result.IsSuccess.Should().BeTrue();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void NonGenericResult_Failure_IsFailure()
    {
        var result = Result.Failure(Error.Validation("Name", "is required"));
        result.IsFailure.Should().BeTrue();
        result.Error!.Code.Should().Be("Name.Validation");
    }
}
```

Create `packages/SharedKernel.Tests/Results/ErrorTests.cs`:
```csharp
using AdventureEngine.SharedKernel.Results;
using FluentAssertions;

namespace AdventureEngine.SharedKernel.Tests.Results;

public sealed class ErrorTests
{
    [Fact]
    public void NotFound_HasExpectedCodeAndMessage()
    {
        var error = Error.NotFound("Product");
        error.Code.Should().Be("Product.NotFound");
        error.Message.Should().Be("Product was not found.");
        error.InternalDetail.Should().BeNull();
    }

    [Fact]
    public void Validation_HasExpectedCodeAndMessage()
    {
        var error = Error.Validation("Email", "must be a valid email address");
        error.Code.Should().Be("Email.Validation");
        error.Message.Should().Be("must be a valid email address");
    }

    [Fact]
    public void Conflict_HasExpectedCodeAndMessage()
    {
        var error = Error.Conflict("Order");
        error.Code.Should().Be("Order.Conflict");
        error.Message.Should().Be("Order already exists.");
    }

    [Fact]
    public void Unexpected_DefaultMessage_IsGeneric()
    {
        var error = Error.Unexpected();
        error.Code.Should().Be("Unexpected");
        error.Message.Should().Be("An unexpected error occurred.");
        error.InternalDetail.Should().BeNull();
    }

    [Fact]
    public void Unexpected_WithInternalDetail_NeverExposesDetailInMessage()
    {
        var error = Error.Unexpected(
            userMessage: "Something went wrong.",
            internalDetail: "NullReferenceException in UserRepository.GetByIdAsync at line 42");

        error.Message.Should().Be("Something went wrong.");
        error.InternalDetail.Should().Contain("NullReferenceException");
        // Message (safe for API consumers) must NOT contain internal detail
        error.Message.Should().NotContain("NullReferenceException");
    }
}
```

---

## 3. item-003 — Aspire AppHost + ServiceDefaults

### 3a. Verify Aspire workload
```bash
dotnet workload list
```
If `aspire` is not listed, run:
```bash
dotnet workload install aspire
```

### 3b. Create the ServiceDefaults project
```bash
dotnet new classlib -n AdventureEngine.ServiceDefaults -o packages/ServiceDefaults --framework net9.0
dotnet sln AdventureEngine.sln add packages/ServiceDefaults/AdventureEngine.ServiceDefaults.csproj
```

Edit `packages/ServiceDefaults/AdventureEngine.ServiceDefaults.csproj`:
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <RootNamespace>AdventureEngine.ServiceDefaults</RootNamespace>
    <AssemblyName>AdventureEngine.ServiceDefaults</AssemblyName>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Http.Resilience" />
    <PackageReference Include="Microsoft.Extensions.ServiceDiscovery" />
    <PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" />
    <PackageReference Include="OpenTelemetry.Extensions.Hosting" />
    <PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" />
    <PackageReference Include="OpenTelemetry.Instrumentation.Http" />
    <PackageReference Include="OpenTelemetry.Instrumentation.Runtime" />
  </ItemGroup>
</Project>
```

> Note: these Aspire-integrated packages are workload-managed. Do NOT add them to `Directory.Packages.props`. Add their version entries here if the build fails requesting versions, but prefer workload management.

Create `packages/ServiceDefaults/Extensions.cs`:
```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace AdventureEngine.ServiceDefaults;

public static class Extensions
{
    /// <summary>
    /// Adds standard service defaults: OpenTelemetry, health checks,
    /// service discovery, and resilience handlers.
    /// Call this in each service's Program.cs: <c>builder.AddServiceDefaults();</c>
    /// </summary>
    public static IHostApplicationBuilder AddServiceDefaults(this IHostApplicationBuilder builder)
    {
        builder.AddBasicServiceDefaults();
        builder.Services.AddServiceDiscovery();
        builder.Services.ConfigureHttpClientDefaults(http =>
        {
            http.AddStandardResilienceHandler();
            http.AddServiceDiscovery();
        });
        return builder;
    }

    public static IHostApplicationBuilder AddBasicServiceDefaults(this IHostApplicationBuilder builder)
    {
        builder.AddDefaultHealthChecks();
        builder.ConfigureOpenTelemetry();
        return builder;
    }

    public static IHostApplicationBuilder ConfigureOpenTelemetry(this IHostApplicationBuilder builder)
    {
        builder.Logging.AddOpenTelemetry(logging =>
        {
            logging.IncludeFormattedMessage = true;
            logging.IncludeScopes = true;
        });

        builder.Services.AddOpenTelemetry()
            .WithMetrics(metrics =>
            {
                metrics
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation();
            })
            .WithTracing(tracing =>
            {
                tracing
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation();
            });

        builder.AddOpenTelemetryExporters();
        return builder;
    }

    private static IHostApplicationBuilder AddOpenTelemetryExporters(this IHostApplicationBuilder builder)
    {
        var useOtlpExporter = !string.IsNullOrWhiteSpace(
            builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]);

        if (useOtlpExporter)
            builder.Services.AddOpenTelemetry().UseOtlpExporter();

        return builder;
    }

    public static IHostApplicationBuilder AddDefaultHealthChecks(this IHostApplicationBuilder builder)
    {
        builder.Services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy(), ["live"]);
        return builder;
    }

    public static WebApplication MapDefaultEndpoints(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.MapHealthChecks("/health/live", new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains("live")
            });
            app.MapHealthChecks("/health/ready", new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains("ready")
            });
        }
        return app;
    }
}
```

### 3c. Create the AppHost project
```bash
dotnet new aspire-apphost -n AdventureEngine.AppHost -o apps/AppHost
dotnet sln AdventureEngine.sln add apps/AppHost/AdventureEngine.AppHost.csproj
```

If `aspire-apphost` template is not available, create manually:

`apps/AppHost/AdventureEngine.AppHost.csproj`:
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <Sdk Name="Aspire.Hosting.Sdk" Version="9.0.0" />
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net9.0</TargetFramework>
    <RootNamespace>AdventureEngine.AppHost</RootNamespace>
    <AssemblyName>AdventureEngine.AppHost</AssemblyName>
    <!-- Suppress Aspire SDK analyzer warnings that would break TreatWarningsAsErrors -->
    <NoWarn>$(NoWarn);ASPIRE001;AZPROVISION001</NoWarn>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Aspire.Hosting.AppHost" />
  </ItemGroup>
</Project>
```

`apps/AppHost/Program.cs`:
```csharp
var builder = DistributedApplication.CreateBuilder(args);

// Sprint 1: No services registered yet.
// Sprint 2 (item-004): Add the API project here:
// builder.AddProject<Projects.AdventureEngine_Api>("api");

builder.Build().Run();
```

### 3d. Create `CONTRIBUTING.md`
```markdown
# Contributing to AdventureEngine

## Prerequisites

Before starting development, ensure the following are installed and configured:

### Required Tools

| Tool | Version | Install |
|------|---------|---------|
| .NET SDK | 9.0 (latestPatch) | https://dot.net |
| Node.js | 22 LTS | https://nodejs.org or `nvm install 22` |
| pnpm | 10+ | `npm install -g pnpm` |
| .NET Aspire workload | latest | `dotnet workload install aspire` |
| Docker Desktop | latest | https://docker.com *(required from Sprint 5)* |

### One-Time Setup

**HTTPS Dev Certificate (required for .NET Aspire):**
```bash
dotnet dev-certs https --trust
```
> ⚠️ On corporate/managed machines, you may need admin rights or use [mkcert](https://github.com/FiloSottile/mkcert) as an alternative.

**Restore dependencies:**
```bash
# From repo root
pnpm install          # Node dependencies
dotnet restore        # NuGet packages
```

---

## Local Development Ports

| Service | Port | Protocol | Notes |
|---------|------|----------|-------|
| .NET Aspire Dashboard | 15888 | HTTPS | Protected by browser token (dev only) |
| API (HTTP) | 5000 | HTTP | Available from Sprint 2 |
| API (HTTPS) | 5001 | HTTPS | Available from Sprint 2 |
| Vite Dev Server | 5173 | HTTP | Available from Sprint 2 |
| Storybook | 6006 | HTTP | Available from Sprint 3 |

> The Aspire dashboard is **development only** and is protected by a browser-session token automatically generated by Aspire. It must never be exposed on a non-loopback network interface.

---

## Running the Application

```bash
# Start the Aspire AppHost (launches all services)
dotnet run --project apps/AppHost

# Or via pnpm (once item-010 wires the scripts):
pnpm start
```

---

## Running Tests

```bash
# Backend tests (all)
dotnet test AdventureEngine.sln

# Backend tests (CI mode with TRX output)
dotnet test AdventureEngine.sln --no-build -c Release \
  --logger trx --results-directory ./TestResults

# Frontend tests (available from Sprint 2)
pnpm test

# E2E tests (available from Sprint 3)
pnpm test:e2e
```

---

## Component File Structure (Frontend — Sprint 2+)

```
src/components/
  Button/
    Button.tsx
    Button.test.tsx
    Button.stories.tsx
    index.ts
```

---

## Security Notes

- **Never commit** `appsettings.*.json`, `.env`, or `launchSettings.json`
- **Never commit** user secrets (`~/.microsoft/usersecrets/`)
- **Never expose** the Aspire dashboard outside localhost
- Run `dotnet list package --vulnerable` periodically to check for CVEs
```

---

## 4. Verify the Build

After all files are created, run these verification commands and ensure all pass:

```bash
# Verify solution builds cleanly (zero warnings, zero errors)
dotnet build AdventureEngine.sln

# Verify all SharedKernel tests pass
dotnet test AdventureEngine.sln --logger "console;verbosity=detailed"

# Verify pnpm workspace is recognized
pnpm install --frozen-lockfile
```

If `dotnet build` fails due to missing Aspire package versions, add the package versions explicitly to `Directory.Packages.props` or to `AppHost.csproj` / `ServiceDefaults.csproj` directly.

---

## 5. DoD Checklist (verify each before finishing)

- [ ] `.pi/project.json` updated with correct language, runtime, architecture, tdd values
- [ ] `backlog.json` item-003 AC corrected (no `AddProject<>()`, HTTPS dashboard URL)
- [ ] `backlog.json` item-002 AC corrected (IDomainEvent as interface, correct method names, IUnitOfWork added)
- [ ] `package.json` has `"packageManager": "pnpm@10.x.x"` and exact `yaml` version
- [ ] `package-lock.json` deleted; `pnpm-lock.yaml` exists
- [ ] `pnpm install` succeeds from root
- [ ] All `.gitignore`, `.editorconfig`, `.nvmrc`, `global.json` files created
- [ ] `Directory.Build.props` has Nullable, ImplicitUsings, TreatWarningsAsErrors, RestorePackagesWithLockFile
- [ ] `Directory.Packages.props` has CPM enabled, NuGetAudit, FluentAssertions pinned to 6.12.2
- [ ] `AdventureEngine.sln` exists and contains all 4 projects
- [ ] All SharedKernel types exist with correct signatures (check each file)
- [ ] All SharedKernel tests exist and cover every type
- [ ] `dotnet build AdventureEngine.sln` exits 0 (zero warnings, zero errors)
- [ ] `dotnet test AdventureEngine.sln` exits 0 (all tests pass)
- [ ] `AppHost.csproj` has `<NoWarn>$(NoWarn);ASPIRE001;AZPROVISION001</NoWarn>`
- [ ] `CONTRIBUTING.md` exists with prerequisites, port table, dev cert instruction, test commands
- [ ] `README.md` placeholder exists

**Summary:** Plan approved with mandatory pre-implementation fixes identified. All five review panels complete. Critical fixes: project.json update, backlog.json item-002 and item-003 AC corrections, IUnitOfWork is non-generic, Aspire dashboard URL is HTTPS, yaml package preserved in migration. Full consolidated implementation brief ready for the builder.

### State: Implementation [Builder] (9m30s)
**Task:** 
## Red Team Assessment — Sprint 1 Implementation Audit

Adversarially inspect the Sprint 1 implementation. Your job is to find everything that is wrong, incomplete, missing, broken, or likely to cause problems downstream. Be thorough and unsparing.

---

### What Should Have Been Built

**item-001 — Monorepo scaffold:**
- `package.json` with pnpm workspaces + `"packageManager": "pnpm@x.x.x"` + scripts
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml` (generated, committed)
- `package-lock.json` DELETED
- `.gitignore` (covers .NET, Node, Aspire, secrets)
- `.nvmrc` (Node LTS)
- `.editorconfig`
- `global.json` (pins .NET SDK, rollForward: latestPatch)
- `Directory.Build.props` (Nullable, ImplicitUsings, TreatWarningsAsErrors, RestorePackagesWithLockFile)
- `Directory.Packages.props` (CPM, NuGetAudit, FluentAssertions=6.12.2, xUnit, NSubstitute, etc.)
- `AdventureEngine.sln`
- `README.md` placeholder
- `apps/` and `packages/` directories

**item-002 — SharedKernel:**
```
packages/SharedKernel/
  AdventureEngine.SharedKernel.csproj  (net10.0 — .NET 10 is installed, not .NET 9)
  src/Primitives/Entity.cs             (IEquatable<Entity<TId>>)
  src/Primitives/ValueObject.cs        (HashCode.Add() pattern)
  src/Primitives/AggregateRoot.cs      (IDomainEventContainer, cached ReadOnlyCollection)
  src/Primitives/IDomainEvent.cs       (DateTimeOffset OccurredOn, Guid EventId)
  src/Primitives/IDomainEventContainer.cs
  src/Repositories/IRepository.cs     (NO SaveChangesAsync)
  src/Repositories/IUnitOfWork.cs
  src/Results/Result.cs                (Result<T> + non-generic Result, both with Match<TOut>)
  src/Results/Error.cs                 (Code, Message, InternalDetail?)
packages/SharedKernel.Tests/
  AdventureEngine.SharedKernel.Tests.csproj
  Primitives/EntityTests.cs
  Primitives/ValueObjectTests.cs
  Primitives/AggregateRootTests.cs
  Results/ResultTests.cs
  Results/ErrorTests.cs
```
**All 39 tests should be passing.**

**item-003 — Aspire AppHost + ServiceDefaults:**
> NOTE: .NET 10 is installed. The Aspire workload is deprecated in .NET 10. Aspire is now pure NuGet packages.
> Aspire 13.1.1 was selected (not 9.x which had a KubernetesClient CVE).
> The builder hit `NETSDK1228` error on `IsAspireHost` — this may mean the AppHost is incomplete or misconfigured.

```
apps/AppHost/
  AdventureEngine.AppHost.csproj
  Program.cs  (minimal — NO AddProject<>())
packages/ServiceDefaults/
  AdventureEngine.ServiceDefaults.csproj
  Extensions.cs  (AddServiceDefaults() with OTel, health checks, resilience)
CONTRIBUTING.md  (prerequisites, port table, dev cert, test commands)
```

**Also required:**
- `.pi/project.json` updated (language=TypeScript+C#, runtime=Node.js+.NET 10, tdd=true, pattern=VSA+DDD)
- `backlog.json` item-002 and item-003 ACs updated

---

### Your Audit Tasks

1. **Read every file** listed above. Check for existence and content correctness.

2. **Run the build and tests:**
   ```bash
   dotnet build AdventureEngine.sln
   dotnet test AdventureEngine.sln --logger "console;verbosity=normal"
   ```
   Report exact output.

3. **Check for `package-lock.json`** — must not exist.

4. **Check `pnpm-lock.yaml`** — must exist.

5. **Verify `backlog.json`** — item-002 AC must reference IDomainEvent as interface (not abstract record); item-003 AC must NOT reference AddProject<>() and must use HTTPS for dashboard URL.

6. **Verify `.pi/project.json`** — must have updated values.

7. **Check the AppHost** — is it buildable? Does `dotnet build apps/AppHost/AdventureEngine.AppHost.csproj` succeed? What Aspire SDK approach is being used?

8. **Look for security issues:**
   - Any hardcoded secrets or connection strings?
   - Any `appsettings.Development.json` that shouldn't be there?
   - Any `launchSettings.json` with exposed ports?

9. **Look for design violations:**
   - Does `IRepository` have `SaveChangesAsync`? (it must NOT)
   - Does `IDomainEvent` use `DateTime` instead of `DateTimeOffset`? (must use `DateTimeOffset`)
   - Does `AggregateRoot` eagerly allocate and cache the ReadOnlyCollection wrapper?
   - Does `Error` have the `InternalDetail` field?
   - Does `Result<T>` have a `Match<TOut>()` method?
   - Is there a non-generic `Result` type?

10. **Check for missing files** — anything in the "should have been built" list that doesn't exist?

11. **Probe edge cases:**
    - What happens if `Entity<TId>` is used as a dictionary key? (GetHashCode must be consistent)
    - What happens if `AggregateRoot.ClearDomainEvents()` is called and then `DomainEvents` is accessed? (cached wrapper must reflect cleared state — check the implementation)
    - Does the non-generic `Result.Success()` return a different instance on each call or is it a singleton? (should be a new instance each time — no shared mutable state)

12. **Verify the DoD checklist from the implementation brief:**
    - [ ] `.pi/project.json` updated
    - [ ] `backlog.json` item-002 and item-003 ACs corrected
    - [ ] `package.json` has `"packageManager"` field and exact `yaml` version
    - [ ] `package-lock.json` deleted; `pnpm-lock.yaml` exists
    - [ ] All scaffold files created
    - [ ] `Directory.Build.props` has all required properties
    - [ ] `Directory.Packages.props` has FluentAssertions=6.12.2
    - [ ] `AdventureEngine.sln` contains all 4 projects
    - [ ] `dotnet build` exits 0
    - [ ] `dotnet test` exits 0 (39 tests pass)
    - [ ] `AppHost.csproj` handles warning suppressions
    - [ ] `CONTRIBUTING.md` exists with prerequisites, port table, dev cert

---

### Report Format

For each issue found:
```
SEVERITY: [CRITICAL | HIGH | MEDIUM | LOW | INFO]
FILE: <path>
ISSUE: <description>
EVIDENCE: <exact code or output>
FIX: <what needs to change>
```

End your report with:
- **PASS** (all DoD items checked, build passes, all tests pass, no critical/high issues)
- **FAIL** (one or more DoD items failed, build errors, test failures, or critical/high issues)

If FAIL, list exactly what needs to be fixed.

**Summary:** Implementation ran for 9.5 minutes. item-001 and item-002 appear complete (39 tests passing). item-003 (AppHost+ServiceDefaults) was in progress when the builder hit a .NET 10 / Aspire NuGet compatibility issue (NETSDK1228 error on IsAspireHost property). Red team needed to audit actual disk state.

## Key Findings (carried from previous states)
- Sprint 1 increment confirmed APPROVED FOR PLANNING — 3 items, 6pt, correctly bounded
- Existing package.json is Pi tooling only — monorepo root package.json must be created fresh; npm package-lock.json must be deleted and replaced with pnpm-lock.yaml during item-001
- item-002 bundles SharedKernel.Tests into scope (consolidating item-014 SharedKernel test side) — item-014 in Sprint 2 covers only the API test project
- item-003 AppHost Program.cs must have zero service references this sprint (API wired in Sprint 2 item-004)
- CONTRIBUTING.md must be created in item-003 with Prerequisites section including dotnet dev-certs https --trust
- R1: package.json conflict with Pi tooling — must be handled during item-001
- R2: .sln merge conflict risk when item-002 and item-003 run in parallel — sequence: item-001 creates .sln stub, item-002 adds SharedKernel+Tests, item-003 adds AppHost+ServiceDefaults
- R3: dotnet workload install aspire must be confirmed before item-003 starts
- R4: package-lock.json (npm) must be deleted during item-001 when switching to pnpm
- R5: TreatWarningsAsErrors + Aspire SDK may need specific warning suppression codes
- Directory.Build.props: Nullable=enable, ImplicitUsings=enable, TreatWarningsAsErrors=true
- Directory.Packages.props: centralized NuGet version management (CPM) enabled
- IDomainEvent: plain marker interface — no MediatR, no INotification dependency
- Result<T>: discriminated union with implicit operators — no exceptions for control flow
- Error: record type with Code+Message and static factory methods (NotFound, Validation, Conflict, Unexpected)
- ARCHITECTURE REVIEW COMPLETE — approved with mandatory fixes
- MUST FIX: Entity<TId> must implement IEquatable<Entity<TId>> explicitly (LINQ performance + complete contract)
- MUST FIX: IDomainEvent.OccurredOn must be DateTimeOffset (not DateTime) — timezone-aware for distributed/serialized contexts
- MUST FIX: IRepository<T,TId> must NOT contain SaveChangesAsync — split to IUnitOfWork<T> interface in Results/ or Repositories/ folder to allow multi-aggregate transactions
- MUST FIX: Remove AddProject<>() from item-003 AppHost AC — API project does not exist until Sprint 2
- MUST FIX: ValueObject.GetHashCode() should use HashCode.Add() pattern (var hash = new HashCode(); foreach component hash.Add(); return hash.ToHashCode()) not HashCode.Combine via Aggregate
- RECOMMENDED: Add Result non-generic type for void operations + Match<TOut> method for exhaustive handling
- RECOMMENDED: AggregateRoot should also implement IDomainEventContainer interface exposing DomainEvents + ClearDomainEvents for infrastructure layer type-safety
- RECOMMENDED: Add notnull+IEquatable<TId> constraint to all generic TId parameters for stronger type safety
- DECISION: ClearDomainEvents stays public — infrastructure layer (post-save dispatching) needs access
- DECISION: ServiceDefaults belongs in packages/ (shared library consumed by each service project, not AppHost)
- DECISION: AppHost references each service project directly; ServiceDefaults is referenced by each service project not by AppHost
- DECISION: IUnitOfWork<T> scoped approach preferred for VSA slices; each slice gets its own UoW instance from DI
- WARNING: Directory.Build.props TreatWarningsAsErrors may break Aspire SDK; add <NoWarn>$(NoWarn);SYSLIB0006</NoWarn> or suppress specific Aspire warning codes
- WARNING: project.json still says language=TypeScript, framework=empty — should be updated to reflect polyglot (TypeScript + C#/.NET 9)
- SECURITY REVIEW COMPLETE — approved with mandatory fixes
- MUST FIX (Security): Error record needs UserMessage/InternalDetail split — Error(Code, Message, InternalDetail?) to prevent future information disclosure via API responses
- MUST FIX (Security): Error.Unexpected() factory must default UserMessage to 'An unexpected error occurred.' and accept optional InternalDetail for log-only use
- MUST FIX (Security): .gitignore must cover appsettings.*.json (except appsettings.json), .env/.env.local/.env.*.local, *.user, launchSettings.json private ports section, .aspire/ local data, user secrets (AppData/Roaming/Microsoft/UserSecrets)
- MUST FIX (Security): FluentAssertions must be pinned to v6.12.2 (last Apache 2.0 release) — v7+ changed license model
- MUST FIX (Security): global.json should use rollForward: latestPatch to allow security patches without manual lockfile updates
- MUST FIX (Security): yaml npm package should be pinned exactly (e.g. 2.8.2) not range specifier ^2.8.0
- SECURITY HARDENING: Add dotnet list package --vulnerable to item-016 CI pipeline AC
- SECURITY HARDENING: Document Aspire dashboard is dev-only, never exposed externally, in CONTRIBUTING.md
- SECURITY HARDENING: Add NuGet audit to Directory.Build.props: <NuGetAudit>true</NuGetAudit> <NuGetAuditLevel>moderate</NuGetAuditLevel>
- SECURITY HARDENING: Use Guid.CreateVersion7() for IDomainEvent.EventId in .NET 9 for sequential ordering (avoids GUID enumeration patterns)
- SECURITY HARDENING: Result<T> implicit operators are safe for this use — no security concern flagged
- SECURITY HARDENING: dotnet dev-certs advice is safe; add caveat in CONTRIBUTING.md for corporate/managed machines (mkcert as alternative)
- SECURITY INFO: Aspire dashboard localhost:15888 is protected by default with a browser token in .NET Aspire 8+ — document this behaviour
- PERFORMANCE REVIEW COMPLETE — approved with notes (no blocking issues)
- PERF NOTE 1 (fix recommended): DomainEvents property should cache the ReadOnlyCollection wrapper to avoid per-access heap allocation: private ReadOnlyCollection<IDomainEvent>? _domainEventsReadOnly; public IReadOnlyList<IDomainEvent> DomainEvents => _domainEventsReadOnly ??= _domainEvents.AsReadOnly();
- PERF NOTE 2 (non-blocking): ValueObject.GetEqualityComponents() allocates enumerator state-machine on every Equals/GetHashCode call; concrete types in hot paths should override Equals directly; base class contract stays IEnumerable<object?> for simplicity
- PERF NOTE 3 (deferred): AggregateRoot eagerly allocates List<IDomainEvent> even for read-only aggregates; lazy init deferred to Sprint 3 when real aggregate loading patterns are known
- PERF NOTE 4 (confirmed safe): Result<T> as sealed class is correct; readonly struct would cause defensive copies with interface constraints and add hidden complexity; class allocation cost is negligible at target scale
- PERF NOTE 5 (non-blocking): Result<T>.Match() should use AggressiveInlining attribute for JIT inlining at call sites
- PERF NOTE 6 (confirmed): Guid.CreateVersion7() is correct for IDomainEvent.EventId - sequential for B-tree index friendliness, negligible cost difference vs NewGuid()
- PERF NOTE 7 (confirmed): IReadOnlyList<IDomainEvent> is correct return type (supports indexed access needed for dispatcher iteration)
- PERF SUMMARY: No blocking performance issues. All SharedKernel base types are appropriately designed for the target scale. Main actionable item is DomainEvents property caching (Finding 1).
- UX REVIEW COMPLETE — fast-pass, no UX scope this sprint, approved
- SPRINT 2 PREP (DX-01): Design tokens must be wired from day one in item-006 — add apps/web/src/styles/tokens.css or Tailwind theme.extend to item-006 AC before Sprint 2 planning
- SPRINT 2 PREP (DX-02): Component file structure must be locked before item-008 (Storybook) — Button/Button.tsx + Button.stories.tsx + index.ts convention; document in CONTRIBUTING.md during item-003
- SPRINT 2 PREP (DX-03): CONTRIBUTING.md port table — Aspire:15888, API HTTP:5000, API HTTPS:5001, Vite:5173, Storybook:6006 — add to item-003 scope
- SPRINT 2 PREP (DX-04): API error response DTO must map Error.Message (user-facing) to toast message field; flag for architect when item-005 (Health Check slice) is implemented
- SPRINT 3 OPEN QUESTION: Storybook version 7 or 8 must be decided before item-006 scaffolds the web app (Vite plugin compatibility)
- SPRINT 3 OPEN QUESTION: packages/design-tokens/ shared package vs tokens only in apps/web/ — decide before Sprint 2 planning
- SPRINT 3 OPEN QUESTION: packages/ui/ shared component library vs apps/web/src/components/ permanent home — decide before Sprint 3 planning
- DEVOPS REVIEW COMPLETE — approved with mandatory fixes
- MUST FIX (DevOps): backlog.json item-003 AC still references AddProject<>() for API which doesn't exist until Sprint 2 — must be corrected before implementation
- MUST FIX (DevOps): package-lock.json must be deleted during item-001 (explicitly add to AC); pnpm-lock.yaml generated via pnpm install
- MUST FIX (DevOps): package.json must have 'packageManager': 'pnpm@10.x.x' field for corepack + CI reproducibility
- MUST FIX (DevOps): Directory.Build.props must add <RestorePackagesWithLockFile>true</RestorePackagesWithLockFile> for CI --locked-mode support
- MUST FIX (DevOps): AppHost.csproj needs <NoWarn>$(NoWarn);ASPIRE001</NoWarn> to prevent TreatWarningsAsErrors breaking builds on Aspire SDK analyzer
- MUST FIX (DevOps): Aspire workload-managed packages (Aspire.Hosting.AppHost etc.) must NOT be versioned in Directory.Packages.props — only non-workload NuGet packages get pinned in CPM
- DEVOPS NOTE: Aspire workload NOT currently installed on this machine — developer taking item-003 must run: dotnet workload install aspire first
- DEVOPS NOTE: Empty AppHost (no resources registered) is a valid Aspire state — dashboard launches with zero resources, no errors
- DEVOPS NOTE: .gitignore must include: .aspire/ (local Aspire state), appsettings.*.json (except appsettings.json), launchSettings.json, .env variants, packages.lock.json should be COMMITTED (not ignored)
- DEVOPS NOTE: dotnet test --no-build -c Release --logger trx --results-directory ./TestResults is the canonical CI command; document in CONTRIBUTING.md
- DEVOPS NOTE: pnpm install --frozen-lockfile is the CI pnpm command; requires pnpm-lock.yaml to be committed
- DEVOPS NOTE: NuGet audit via Directory.Packages.props: <NuGetAudit>true</NuGetAudit> <NuGetAuditLevel>moderate</NuGetAuditLevel>
- DEVOPS NOTE: CONTRIBUTING.md port table confirmed: Aspire Dashboard 15888, API HTTP 5000 / HTTPS 5001, Vite 5173, Storybook 6006
- DEVOPS NOTE: Aspire workload version consistency — document required workload version in CONTRIBUTING.md; no dotnet-tools.json mechanism for workloads (workloads are separate from tools manifest)
- PLAN APPROVAL: APPROVED WITH MANDATORY PRE-IMPLEMENTATION FIXES
- CRITICAL C1: Both backlog.json AND SPRINT_1_PLAN.md contain AddProject<>() reference in item-003 AC — both files must be corrected
- CRITICAL C2: .pi/project.json is stale (language=TypeScript, runtime=Node.js, tdd=false, pattern=clean) — must be updated to reflect polyglot repo before builder runs
- CRITICAL C3: backlog.json item-002 AC describes IDomainEvent as 'abstract record' (wrong) and IRepository methods as Find/Add/Update/Remove (wrong) and omits IUnitOfWork, IDomainEventContainer, non-generic Result — must be corrected
- HIGH H1: IUnitOfWork must be non-generic (not IUnitOfWork<T>) — non-generic interface is the correct abstraction at the domain layer
- HIGH H2: yaml package migration — when item-001 creates new root package.json, Pi tooling yaml dependency must be preserved; pin to exact version e.g. 2.8.2
- HIGH H3: Aspire warning suppressions confirmed: ASPIRE001 in AppHost.csproj; also suppress AZPROVISION001 if Azure provisioning used; CS0618 for Aspire preview API; add NoWarn to AppHost.csproj not Directory.Build.props
- HIGH H4: AppHost dashboard URL is HTTPS://localhost:15888 not HTTP — both backlog.json and SPRINT_1_PLAN.md have wrong protocol; Aspire 8+ defaults to HTTPS with browser token auth
- RESOLVED: IUnitOfWork is non-generic: Task<int> SaveChangesAsync(CancellationToken ct = default)
- RESOLVED: IDomainEventContainer interface: IReadOnlyList<IDomainEvent> DomainEvents { get; } + void ClearDomainEvents()
- CONFIRMED: All arch+security+perf+devops mandatory fixes approved for implementation
- CONFIRMED: Recommendations AR1 (non-generic Result), AR2 (Match method), AR3 (IDomainEventContainer), P1 (DomainEvents caching), P2 (AggressiveInlining on Match) elevated to mandatory this sprint
- IMPLEMENTATION: .NET 10 SDK installed (not .NET 9) — all target frameworks updated to net10.0
- IMPLEMENTATION: Aspire workload is DEPRECATED in .NET 10 — Aspire is now pure NuGet packages; no workload install needed
- IMPLEMENTATION: Aspire 13.1.1 selected (not 9.x) — v9 had KubernetesClient CVE; v13.1.1 restores clean
- IMPLEMENTATION CONFIRMED COMPLETE: item-001 monorepo scaffold, .gitignore, .editorconfig, .nvmrc, global.json, Directory.Build.props, Directory.Packages.props, pnpm-lock.yaml, AdventureEngine.sln
- IMPLEMENTATION CONFIRMED COMPLETE: item-002 SharedKernel library (all 7 types: Entity, ValueObject, AggregateRoot, IDomainEvent, IDomainEventContainer, IRepository, IUnitOfWork, Result<T>, Result, Error)
- IMPLEMENTATION CONFIRMED COMPLETE: item-002 SharedKernel.Tests — 39 tests all passing
- IMPLEMENTATION STATUS UNKNOWN: item-003 AppHost + ServiceDefaults — builder hit NETSDK1228 error on IsAspireHost property with .NET 10; investigation was in progress when output truncated
- pnpm version installed: check actual version; pin in package.json packageManager field
- xUnit 3.1.4 requires explicit Xunit using in csproj: <Using Include="Xunit" /> added to test project
- FluentAssertions pinned to 6.12.2 as required (Apache 2.0 license)
- RED TEAM RESULT: FAIL — 4 critical issues, 1 high issue found
- CRITICAL RT-1: AppHost NETSDK1228 error — must use Sdk='Aspire.AppHost.Sdk/13.1.1' as outer SDK, not Microsoft.NET.Sdk with IsAspireHost=true. Add Aspire.AppHost.Sdk version 13.1.1 to Directory.Packages.props
- CRITICAL RT-2: ServiceDefaults directory MISSING — packages/ServiceDefaults/ was never created; item-003 incomplete
- CRITICAL RT-3: AdventureEngine.slnx only contains 2 projects (SharedKernel + SharedKernel.Tests); AppHost and ServiceDefaults must be added after they are fixed/created
- CRITICAL RT-4: CONTRIBUTING.md MISSING — item-003 DoD requires it; file was never written
- HIGH RT-5: Entity<TId>.Equals() cross-type bug — Order(id=1).Equals(Customer(id=1)) returns TRUE because IEquatable<Entity<TId>> doesn't check GetType(). Fix: add GetType() check: other.GetType() == GetType() && Id.Equals(other.Id)
- CONFIRMED GOOD: All 39 SharedKernel tests pass; item-001 scaffold complete; item-002 types correct; IRepository has no SaveChangesAsync; IDomainEvent uses DateTimeOffset; Error has InternalDetail; Result<T> has Match(); non-generic Result exists
- CONFIRMED GOOD: package-lock.json deleted; pnpm-lock.yaml exists; Directory.Build.props correct; FluentAssertions=6.12.2; .pi/project.json updated; backlog.json item-002 and item-003 ACs corrected

## Pending Tasks (handed over from previous states)
- Architecture review: validate VSA + DDD + Clean Architecture structural decisions, project references, SharedKernel design
- Security review: pre-implementation threat model for SharedKernel and Aspire setup
- Performance review: SharedKernel base type performance considerations
- UX review: N/A this sprint (no frontend)
- DevOps review: Aspire AppHost config, solution structure, CI implications of Directory.Build.props/Packages.props
- Plan approval: final gate before implementation
- Implementation: item-001 first (monorepo scaffold), then item-002 + item-003 in parallel
- Commit: conventional commit after implementation verified
- Security review: threat model for SharedKernel (Result<T>, Error, domain event contracts) and Aspire setup
- Performance review: SharedKernel base type performance (equality, hash, Result allocations)
- UX review: skip or fast-pass (no frontend this sprint)
- DevOps review: Aspire AppHost config, Directory.Build.props warnings-as-errors safety, solution structure CI implications
- Plan approval: synthesize all review feedback, confirm mandatory fixes are incorporated into implementation task
- Implementation: apply all mandatory fixes from architecture review during coding
- Performance review: SharedKernel base type performance (Entity equality, ValueObject GetHashCode, Result<T> allocations, AggregateRoot domain events list)
- UX review: fast-pass (no frontend this sprint)
- DevOps review: Aspire AppHost config, TreatWarningsAsErrors + Aspire SDK warnings, solution structure, CI implications
- Plan approval: synthesize all review feedback (arch + security)
- Implementation: apply all mandatory fixes from both arch and security reviews
- UX review: fast-pass — no frontend this sprint
- DevOps review: Aspire AppHost config, TreatWarningsAsErrors + Aspire SDK, solution structure, CI pipeline implications
- Plan approval: synthesize arch + security + performance findings, confirm all mandatory fixes are in implementation task
- Implementation: apply all mandatory fixes (IEquatable, DateTimeOffset, IUnitOfWork split, HashCode.Add, Error.InternalDetail, FluentAssertions v6, global.json rollForward, DomainEvents caching)
- DevOps review: Aspire AppHost config, TreatWarningsAsErrors + Aspire SDK warnings, solution structure (dotnet build from root), CI/CD implications, secrets management
- Plan approval: synthesize ALL review findings (arch + security + perf + UX/DX) into final implementation task
- Implementation: apply all mandatory fixes during coding
- Plan approval: synthesize ALL review findings (arch + security + perf + UX/DX + devops) into a final implementation task with complete, consolidated mandatory fix list
- Fix backlog.json item-003 AC to remove AddProject<>() reference before implementation
- Implementation: builder agent executes all three items with all mandatory fixes applied
- Implementation: builder must fix backlog.json item-003 AC (remove AddProject<>(), correct dashboard URL to HTTPS)
- Implementation: builder must fix backlog.json item-002 AC (IDomainEvent as interface not abstract record, correct method names, add IUnitOfWork/IDomainEventContainer/non-generic Result)
- Implementation: builder must update .pi/project.json (language, runtime, tdd, architecture pattern, testing frameworks)
- Implementation: builder implements all three sprint items with ALL mandatory fixes from all five review panels
- Red team: audit all files created, verify 39 tests pass, identify AppHost completion status and any gaps
- If AppHost incomplete: return to implementation with .NET 10 / Aspire NuGet-first AppHost pattern
- Verification: full dotnet build + dotnet test + pnpm install pass
- Fix 1 (CRITICAL): Fix AppHost.csproj to use Aspire.AppHost.Sdk/13.1.1 as outer SDK
- Fix 2 (CRITICAL): Create packages/ServiceDefaults/ project with Extensions.cs
- Fix 3 (CRITICAL): Add AppHost and ServiceDefaults to AdventureEngine.slnx
- Fix 4 (CRITICAL): Create CONTRIBUTING.md
- Fix 5 (HIGH): Fix Entity<TId>.Equals() to include GetType() check; add cross-type equality test
- Verification: dotnet build AdventureEngine.slnx must exit 0; dotnet test must pass all tests including new EntityTests cross-type test

## Your Task

## Implementation — Sprint 1 Fix Pass (Targeted)

The red team audit found 5 issues. The following is the **complete and exhaustive** fix list. Do exactly these tasks and nothing else. Do not modify anything that wasn't flagged.

---

## Fix 1 (CRITICAL) — AppHost SDK

The AppHost currently uses `Microsoft.NET.Sdk` with `<IsAspireHost>true</IsAspireHost>`. In .NET 10, this triggers `NETSDK1228`. The correct SDK is `Aspire.AppHost.Sdk`.

### Step 1a — Update `Directory.Packages.props`
Add to the Aspire section (or create a new ItemGroup if one doesn't exist for Aspire):
```xml
<PackageVersion Include="Aspire.AppHost.Sdk" Version="13.1.1" />
<PackageVersion Include="Aspire.Hosting.AppHost" Version="13.1.1" />
```
If `Aspire.Hosting.AppHost` is already listed, ensure its version is `13.1.1`.

### Step 1b — Rewrite `apps/AppHost/AdventureEngine.AppHost.csproj`
Replace the entire file content with:
```xml
<Project Sdk="Aspire.AppHost.Sdk/13.1.1">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <RootNamespace>AdventureEngine.AppHost</RootNamespace>
    <AssemblyName>AdventureEngine.AppHost</AssemblyName>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <!-- Suppress Aspire SDK analyzer warnings to prevent TreatWarningsAsErrors breakage -->
    <NoWarn>$(NoWarn);ASPIRE001;AZPROVISION001</NoWarn>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Aspire.Hosting.AppHost" />
  </ItemGroup>

</Project>
```

### Step 1c — Verify AppHost builds
```bash
dotnet restore apps/AppHost/AdventureEngine.AppHost.csproj
dotnet build apps/AppHost/AdventureEngine.AppHost.csproj
```
Expected: exits 0. No `NETSDK1228`. No errors.

---

## Fix 2 (CRITICAL) — Create `packages/ServiceDefaults/`

### Step 2a — Create directory and project file
```bash
mkdir -p packages/ServiceDefaults
```

Create `packages/ServiceDefaults/AdventureEngine.ServiceDefaults.csproj`:
```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <RootNamespace>AdventureEngine.ServiceDefaults</RootNamespace>
    <AssemblyName>AdventureEngine.ServiceDefaults</AssemblyName>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <FrameworkReference Include="Microsoft.AspNetCore.App" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Http.Resilience" />
    <PackageReference Include="Microsoft.Extensions.ServiceDiscovery" />
    <PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" />
    <PackageReference Include="OpenTelemetry.Extensions.Hosting" />
    <PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" />
    <PackageReference Include="OpenTelemetry.Instrumentation.Http" />
    <PackageReference Include="OpenTelemetry.Instrumentation.Runtime" />
  </ItemGroup>

</Project>
```

### Step 2b — Add required NuGet versions to `Directory.Packages.props`
Add these PackageVersion entries (check what's already there; add only missing ones):
```xml
<PackageVersion Include="Microsoft.Extensions.Http.Resilience" Version="9.6.0" />
<PackageVersion Include="Microsoft.Extensions.ServiceDiscovery" Version="9.6.0" />
<PackageVersion Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" Version="1.12.0" />
<PackageVersion Include="OpenTelemetry.Extensions.Hosting" Version="1.12.0" />
<PackageVersion Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.12.0" />
<PackageVersion Include="OpenTelemetry.Instrumentation.Http" Version="1.12.0" />
<PackageVersion Include="OpenTelemetry.Instrumentation.Runtime" Version="1.12.0" />
```
> If version resolution fails, use `dotnet add package` to discover compatible versions for net10.0, then pin those in Directory.Packages.props and remove inline versions.

### Step 2c — Create `packages/ServiceDefaults/Extensions.cs`
```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace AdventureEngine.ServiceDefaults;

public static class Extensions
{
    /// <summary>
    /// Adds standard cross-cutting service defaults: OpenTelemetry, health checks,
    /// service discovery, and resilience handlers.
    /// Call this in each service's Program.cs: <c>builder.AddServiceDefaults();</c>
    /// </summary>
    public static IHostApplicationBuilder AddServiceDefaults(this IHostApplicationBuilder builder)
    {
        builder.AddBasicServiceDefaults();

        builder.Services.AddServiceDiscovery();

        builder.Services.ConfigureHttpClientDefaults(http =>
        {
            http.AddStandardResilienceHandler();
            http.AddServiceDiscovery();
        });

        return builder;
    }

    public static IHostApplicationBuilder AddBasicServiceDefaults(this IHostApplicationBuilder builder)
    {
        builder.AddDefaultHealthChecks();
        builder.ConfigureOpenTelemetry();
        return builder;
    }

    public static IHostApplicationBuilder ConfigureOpenTelemetry(this IHostApplicationBuilder builder)
    {
        builder.Logging.AddOpenTelemetry(logging =>
        {
            logging.IncludeFormattedMessage = true;
            logging.IncludeScopes = true;
        });

        builder.Services.AddOpenTelemetry()
            .WithMetrics(metrics =>
            {
                metrics
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation();
            })
            .WithTracing(tracing =>
            {
                tracing
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation();
            });

        builder.AddOpenTelemetryExporters();
        return builder;
    }

    private static IHostApplicationBuilder AddOpenTelemetryExporters(this IHostApplicationBuilder builder)
    {
        var useOtlpExporter = !string.IsNullOrWhiteSpace(
            builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]);

        if (useOtlpExporter)
        {
            builder.Services.AddOpenTelemetry().UseOtlpExporter();
        }

        return builder;
    }

    public static IHostApplicationBuilder AddDefaultHealthChecks(this IHostApplicationBuilder builder)
    {
        builder.Services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy(), ["live"]);

        return builder;
    }

    public static WebApplication MapDefaultEndpoints(this WebApplication app)
    {
        // Only expose health endpoints in development
        if (app.Environment.IsDevelopment())
        {
            app.MapHealthChecks("/health/live", new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains("live")
            });

            app.MapHealthChecks("/health/ready", new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains("ready")
            });
        }

        return app;
    }
}
```

### Step 2d — Verify ServiceDefaults builds
```bash
dotnet restore packages/ServiceDefaults/AdventureEngine.ServiceDefaults.csproj
dotnet build packages/ServiceDefaults/AdventureEngine.ServiceDefaults.csproj
```
Expected: exits 0.

---

## Fix 3 (CRITICAL) — Add missing projects to the solution

```bash
dotnet sln AdventureEngine.slnx add apps/AppHost/AdventureEngine.AppHost.csproj
dotnet sln AdventureEngine.slnx add packages/ServiceDefaults/AdventureEngine.ServiceDefaults.csproj
```

Verify:
```bash
dotnet sln AdventureEngine.slnx list
```
Expected output should contain all 4 projects:
- `apps/AppHost/AdventureEngine.AppHost.csproj`
- `packages/ServiceDefaults/AdventureEngine.ServiceDefaults.csproj`
- `packages/SharedKernel/AdventureEngine.SharedKernel.csproj`
- `packages/SharedKernel.Tests/AdventureEngine.SharedKernel.Tests.csproj`

---

## Fix 4 (CRITICAL) — Create `CONTRIBUTING.md`

Create at repo root:

```markdown
# Contributing to AdventureEngine

## Prerequisites

Before starting development, ensure the following are installed and configured on your machine.

### Required Tools

| Tool | Version | Install |
|------|---------|---------|
| .NET SDK | 10.0 (latestPatch) | https://dot.net |
| Node.js | 22 LTS | https://nodejs.org or `nvm install 22` |
| pnpm | 10+ | `npm install -g pnpm` or `corepack enable && corepack prepare pnpm@latest --activate` |
| Docker Desktop | latest | https://docker.com *(required from Sprint 5 — item-012)* |

> **Note:** The .NET Aspire workload is **not required** on .NET 10+. Aspire ships via NuGet packages directly.

### One-Time Machine Setup

#### 1. HTTPS Dev Certificate (required for .NET Aspire dashboard)
```bash
dotnet dev-certs https --trust
```
> ⚠️ **Corporate / managed machines:** If you don't have admin rights to trust the cert, use [mkcert](https://github.com/FiloSottile/mkcert) as an alternative, or ask your IT team to trust the .NET development certificate.

#### 2. Install dependencies
```bash
# From repo root — installs Node workspace packages
pnpm install

# Restore NuGet packages
dotnet restore
```

---

## Local Development Ports

| Service | Port | Protocol | Notes |
|---------|------|----------|-------|
| .NET Aspire Dashboard | 15888 | **HTTPS** | Protected by browser session token (dev only, never expose externally) |
| API (HTTP) | 5000 | HTTP | Available from Sprint 2 (item-004) |
| API (HTTPS) | 5001 | HTTPS | Available from Sprint 2 (item-004) |
| Vite Dev Server | 5173 | HTTP | Available from Sprint 2 (item-006) |
| Storybook | 6006 | HTTP | Available from Sprint 3 (item-008) |

> The Aspire dashboard is **development-only** and is automatically protected by a browser session token generated at startup. It must **never** be bound to a non-loopback interface (never use `--urls 0.0.0.0:15888`).

---

## Running the Application

```bash
# Start the .NET Aspire AppHost (Sprint 1 — dashboard only, no services yet)
dotnet run --project apps/AppHost

# Full stack start (available from Sprint 2 — item-010):
pnpm start
```

---

## Running Tests

```bash
# All backend tests
dotnet test AdventureEngine.slnx

# Backend tests — CI mode (TRX output for test reporting)
dotnet test AdventureEngine.slnx --no-build -c Release \
  --logger trx \
  --results-directory ./TestResults

# Frontend unit + component tests (available from Sprint 2 — item-007)
pnpm test

# E2E tests (available from Sprint 3 — item-009)
pnpm test:e2e

# API tests (alias for dotnet test)
pnpm test:api
```

---

## Component File Structure (Frontend — Sprint 2+)

When adding new UI components in `apps/web/src/components/`, follow this structure:

```
src/components/
  Button/
    Button.tsx          ← component implementation
    Button.test.tsx     ← Vitest + React Testing Library unit test
    Button.stories.tsx  ← Storybook story
    index.ts            ← re-export: export { Button } from './Button'
```

---

## Security Notes

- **Never commit** `appsettings.*.json` (except base `appsettings.json`)
- **Never commit** `.env`, `.env.local`, or any `.env.*` files
- **Never commit** `launchSettings.json`
- **Never commit** user secrets (`~/.microsoft/usersecrets/` or `%APPDATA%\Microsoft\UserSecrets\`)
- **Never expose** the Aspire dashboard on a non-loopback interface
- Run `dotnet list package --vulnerable` periodically to check for CVEs in NuGet dependencies
- Run `pnpm audit` periodically to check for CVEs in npm dependencies
```

---

## Fix 5 (HIGH) — Entity cross-type equality bug

### Step 5a — Update `packages/SharedKernel/src/Primitives/Entity.cs`

Change the `Equals(Entity<TId>? other)` method to include a type identity check:

```csharp
public bool Equals(Entity<TId>? other)
    => other is not null
       && other.GetType() == GetType()   // ← ADD THIS LINE
       && Id.Equals(other.Id);
```

The full updated file:
```csharp
namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Base class for all domain entities. Equality is determined by type + identity (Id).
/// Two entities of different types with the same Id are NOT equal.
/// </summary>
public abstract class Entity<TId> : IEquatable<Entity<TId>>
    where TId : notnull
{
    public TId Id { get; protected init; }

    protected Entity(TId id)
    {
        Id = id;
    }

    public bool Equals(Entity<TId>? other)
        => other is not null
           && other.GetType() == GetType()
           && Id.Equals(other.Id);

    public override bool Equals(object? obj)
        => Equals(obj as Entity<TId>);

    public override int GetHashCode()
        => HashCode.Combine(GetType(), Id);   // ← ALSO include GetType() in hash

    public static bool operator ==(Entity<TId>? left, Entity<TId>? right)
        => left?.Equals(right) ?? right is null;

    public static bool operator !=(Entity<TId>? left, Entity<TId>? right)
        => !(left == right);
}
```

> ⚠️ **Note:** `GetHashCode()` must also include `GetType()` — otherwise `Order(id=1)` and `Customer(id=1)` would have the same hash even though they now compare as not-equal. Hash collisions with non-equal objects are allowed but cause severe `HashSet`/`Dictionary` performance degradation when they occur consistently.

### Step 5b — Add the cross-type equality test to `EntityTests.cs`

Add this test to `packages/SharedKernel.Tests/Primitives/EntityTests.cs`:

```csharp
[Fact]
public void Entities_OfDifferentTypes_WithSameId_AreNotEqual()
{
    // Different concrete types sharing the same TId type (both Entity<Guid>)
    var id = Guid.NewGuid();
    
    // We need two different entity types — reuse TestEntity and add a second
    // TestEntity is a sealed inner class; we need another. Use a local type:
    var entityA = new TestEntityA(id);
    var entityB = new TestEntityB(id);

    entityA.Should().NotBe(entityB);
    (entityA == entityB).Should().BeFalse();
    entityA.GetHashCode().Should().NotBe(entityB.GetHashCode());
}

// Add these concrete types alongside the existing TestEntity
private sealed class TestEntityA(Guid id) : Entity<Guid>(id);
private sealed class TestEntityB(Guid id) : Entity<Guid>(id);
```

> Also rename the existing `TestEntity` to `TestEntityA` in the existing tests, or keep it as-is and add `TestEntityA`/`TestEntityB` as additional private types. The simplest path: keep `TestEntity` for existing tests, add `TestEntityA` and `TestEntityB` as new private inner classes.

---

## Final Verification

After all 5 fixes are applied, run:

```bash
# 1. Full solution build (must exit 0, zero warnings)
dotnet build AdventureEngine.slnx

# 2. All tests (must exit 0, all tests pass — at least 40 now with the new cross-type test)
dotnet test AdventureEngine.slnx --logger "console;verbosity=normal"

# 3. Verify solution has 4 projects
dotnet sln AdventureEngine.slnx list

# 4. Verify pnpm workspace
pnpm install --frozen-lockfile
```

**Do not proceed until all 4 commands exit 0.**


## When You Are Done
End your response with a clear summary of:
- What you accomplished
- Key findings or decisions made
- Files created or modified (if any)
- Recommendations or blockers for the next step
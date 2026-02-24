namespace AdventureEngine.SharedKernel.Repositories;

/// <summary>
/// Abstraction for committing a unit of work. Decoupled from individual repositories
/// to support multi-aggregate transactions within a single use case.
/// <para>
/// Inject this alongside <see cref="IRepository{T,TId}"/> in use-case handlers and call
/// <see cref="SaveChangesAsync"/> once all mutations are complete.
/// </para>
/// </summary>
public interface IUnitOfWork
{
    /// <summary>
    /// Persists all pending changes tracked in the current unit of work.
    /// Returns the number of state entries written to the store.
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

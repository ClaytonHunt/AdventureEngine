using AdventureEngine.SharedKernel.Primitives;

namespace AdventureEngine.SharedKernel.Repositories;

/// <summary>
/// Generic repository abstraction for aggregate roots.
/// <para>
/// Does NOT include <c>SaveChangesAsync</c> — use <see cref="IUnitOfWork"/> for committing
/// changes to allow multi-aggregate transactions within a single use case.
/// </para>
/// </summary>
/// <typeparam name="T">The aggregate root type.</typeparam>
/// <typeparam name="TId">The aggregate root identifier type. Must be non-null.</typeparam>
public interface IRepository<T, TId>
    where T : AggregateRoot<TId>
    where TId : notnull
{
    /// <summary>Returns the aggregate with the given <paramref name="id"/>, or <c>null</c> if not found.</summary>
    Task<T?> GetByIdAsync(TId id, CancellationToken ct = default);

    /// <summary>Adds a new aggregate to the repository (insert on next save).</summary>
    Task AddAsync(T entity, CancellationToken ct = default);

    /// <summary>Marks an existing aggregate as modified (update on next save).</summary>
    Task UpdateAsync(T entity, CancellationToken ct = default);

    /// <summary>Removes the aggregate with the given <paramref name="id"/> (delete on next save).</summary>
    Task DeleteAsync(TId id, CancellationToken ct = default);
}

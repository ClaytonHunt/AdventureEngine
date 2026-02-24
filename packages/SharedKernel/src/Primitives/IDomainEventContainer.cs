namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Exposes the domain event list to infrastructure layers (e.g. EF Core interceptors,
/// post-save event dispatchers). Not intended to be called by application or domain code
/// directly — use <see cref="AggregateRoot{TId}.AddDomainEvent"/> within the aggregate.
/// </summary>
public interface IDomainEventContainer
{
    /// <summary>The domain events raised by this aggregate since the last <see cref="ClearDomainEvents"/> call.</summary>
    IReadOnlyList<IDomainEvent> DomainEvents { get; }

    /// <summary>
    /// Clears all domain events from the aggregate. Called by infrastructure after
    /// events have been dispatched (post-save).
    /// </summary>
    void ClearDomainEvents();
}

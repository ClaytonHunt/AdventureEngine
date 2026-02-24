using System.Collections.ObjectModel;

namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Base class for aggregate roots. Extends <see cref="Entity{TId}"/> with the ability
/// to raise and own domain events. Implements <see cref="IDomainEventContainer"/> so
/// infrastructure layers can access and dispatch events after persistence.
/// </summary>
/// <typeparam name="TId">The type of the aggregate root identifier. Must be non-null.</typeparam>
public abstract class AggregateRoot<TId> : Entity<TId>, IDomainEventContainer
    where TId : notnull
{
    private readonly List<IDomainEvent> _domainEvents = [];
    private ReadOnlyCollection<IDomainEvent>? _domainEventsReadOnly;

    /// <summary>Initialises a new aggregate root with the given identifier.</summary>
    protected AggregateRoot(TId id) : base(id) { }

    /// <inheritdoc />
    public IReadOnlyList<IDomainEvent> DomainEvents
        => _domainEventsReadOnly ??= _domainEvents.AsReadOnly();

    /// <summary>
    /// Raises a domain event from within the aggregate. Call this in command methods
    /// to signal that something meaningful has happened in the domain.
    /// </summary>
    protected void AddDomainEvent(IDomainEvent domainEvent)
        => _domainEvents.Add(domainEvent);

    /// <inheritdoc />
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
        _domainEventsReadOnly = null; // invalidate cached wrapper after clear
    }
}

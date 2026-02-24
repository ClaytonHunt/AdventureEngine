namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Marker interface for domain events raised by aggregate roots.
/// No MediatR dependency — this is a plain interface.
/// <para>
/// Implementors should use <see cref="Guid.CreateVersion7()"/> for <see cref="EventId"/>
/// to produce monotonically increasing, B-tree-index-friendly identifiers.
/// </para>
/// </summary>
public interface IDomainEvent
{
    /// <summary>
    /// A unique, ordered identifier for this event instance.
    /// Use <see cref="Guid.CreateVersion7()"/> when implementing.
    /// </summary>
    Guid EventId { get; }

    /// <summary>The UTC instant at which the domain event occurred.</summary>
    DateTimeOffset OccurredOn { get; }
}

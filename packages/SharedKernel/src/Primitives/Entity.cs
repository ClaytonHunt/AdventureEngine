namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Base class for all domain entities. Equality is determined by identity (<see cref="Id"/>),
/// not by structural comparison. Two entities with the same <typeparamref name="TId"/> are
/// considered equal regardless of their other properties.
/// </summary>
/// <typeparam name="TId">The type of the entity identifier. Must be non-null.</typeparam>
public abstract class Entity<TId> : IEquatable<Entity<TId>>
    where TId : notnull
{
    /// <summary>The unique identifier for this entity.</summary>
    public TId Id { get; protected init; }

    /// <summary>Initialises a new entity with the given identifier.</summary>
    protected Entity(TId id)
    {
        Id = id;
    }

    /// <inheritdoc />
    public bool Equals(Entity<TId>? other)
        => other is not null && Id.Equals(other.Id);

    /// <inheritdoc />
    public override bool Equals(object? obj)
        => Equals(obj as Entity<TId>);

    /// <inheritdoc />
    public override int GetHashCode()
        => Id.GetHashCode();

    /// <summary>Equality operator based on entity identity.</summary>
    public static bool operator ==(Entity<TId>? left, Entity<TId>? right)
        => left?.Equals(right) ?? right is null;

    /// <summary>Inequality operator based on entity identity.</summary>
    public static bool operator !=(Entity<TId>? left, Entity<TId>? right)
        => !(left == right);
}

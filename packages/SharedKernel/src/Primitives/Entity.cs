namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Base class for all domain entities. Equality is determined by type + identity (<see cref="Id"/>).
/// Two entities with the same <typeparamref name="TId"/> but different concrete types are NOT equal —
/// e.g. <c>Order(id=1)</c> and <c>Customer(id=1)</c> are distinct.
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
        => other is not null
           && other.GetType() == GetType()
           && Id.Equals(other.Id);

    /// <inheritdoc />
    public override bool Equals(object? obj)
        => Equals(obj as Entity<TId>);

    /// <inheritdoc />
    /// <remarks>
    /// Includes <see cref="object.GetType()"/> to ensure that entities of different types
    /// with the same <typeparamref name="TId"/> do not share a hash code, which would cause
    /// performance degradation in <see cref="System.Collections.Generic.HashSet{T}"/> and
    /// <see cref="System.Collections.Generic.Dictionary{TKey,TValue}"/>.
    /// </remarks>
    public override int GetHashCode()
        => HashCode.Combine(GetType(), Id);

    /// <summary>Equality operator based on entity type + identity.</summary>
    public static bool operator ==(Entity<TId>? left, Entity<TId>? right)
        => left?.Equals(right) ?? right is null;

    /// <summary>Inequality operator based on entity type + identity.</summary>
    public static bool operator !=(Entity<TId>? left, Entity<TId>? right)
        => !(left == right);
}

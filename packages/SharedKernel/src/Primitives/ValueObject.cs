namespace AdventureEngine.SharedKernel.Primitives;

/// <summary>
/// Base class for value objects. Equality is structural — determined by the values returned
/// by <see cref="GetEqualityComponents"/>, not by reference identity.
/// </summary>
public abstract class ValueObject
{
    /// <summary>
    /// Returns the components used for equality and hash-code computation.
    /// Use <c>yield return</c> for each significant field or property.
    /// </summary>
    protected abstract IEnumerable<object?> GetEqualityComponents();

    /// <inheritdoc />
    public override bool Equals(object? obj)
    {
        if (obj?.GetType() != GetType()) return false;
        if (obj is not ValueObject other) return false;
        return GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }

    /// <inheritdoc />
    public override int GetHashCode()
    {
        var hash = new HashCode();
        foreach (var component in GetEqualityComponents())
            hash.Add(component);
        return hash.ToHashCode();
    }

    /// <summary>Equality operator based on structural component values.</summary>
    public static bool operator ==(ValueObject? left, ValueObject? right)
        => left?.Equals(right) ?? right is null;

    /// <summary>Inequality operator based on structural component values.</summary>
    public static bool operator !=(ValueObject? left, ValueObject? right)
        => !(left == right);
}

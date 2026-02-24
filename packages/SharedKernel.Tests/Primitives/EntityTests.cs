using AdventureEngine.SharedKernel.Primitives;
using FluentAssertions;

namespace AdventureEngine.SharedKernel.Tests.Primitives;

public sealed class EntityTests
{
    private sealed class TestEntity(Guid id) : Entity<Guid>(id);

    // Two distinct entity types sharing the same TId — used for cross-type tests
    private sealed class OrderEntity(Guid id) : Entity<Guid>(id);
    private sealed class CustomerEntity(Guid id) : Entity<Guid>(id);

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
    public void Entity_GetHashCode_IncludesTypeAndId()
    {
        var id = Guid.NewGuid();
        var entity = new TestEntity(id);

        // Hash must incorporate both GetType() and Id — not just Id alone
        entity.GetHashCode().Should().Be(HashCode.Combine(typeof(TestEntity), id));
    }

    [Fact]
    public void Entity_GetHashCode_IsConsistentForSameInstance()
    {
        var entity = new TestEntity(Guid.NewGuid());

        entity.GetHashCode().Should().Be(entity.GetHashCode());
    }

    [Fact]
    public void Entity_ImplementsIEquatable()
    {
        typeof(TestEntity).Should().Implement(typeof(IEquatable<Entity<Guid>>));
    }

    [Fact]
    public void Entity_Equals_Null_ReturnsFalse()
    {
        var entity = new TestEntity(Guid.NewGuid());

        entity.Equals(null).Should().BeFalse();
        (entity == null).Should().BeFalse();
    }

    [Fact]
    public void Entity_Equals_DifferentType_ReturnsFalse()
    {
        var entity = new TestEntity(Guid.NewGuid());

        entity.Equals("not an entity").Should().BeFalse();
    }

    [Fact]
    public void Entities_OfDifferentConcreteTypes_WithSameId_AreNotEqual()
    {
        // Order(id=X) must NOT equal Customer(id=X) — they are different domain concepts
        var sharedId = Guid.NewGuid();
        var order = new OrderEntity(sharedId);
        var customer = new CustomerEntity(sharedId);

        order.Should().NotBe(customer);
        (order == customer).Should().BeFalse();
    }

    [Fact]
    public void Entities_OfDifferentConcreteTypes_WithSameId_HaveDifferentHashCodes()
    {
        // Different types with same Id must NOT produce the same hash code.
        // Equal hash codes are allowed by contract but would cause systematic
        // performance degradation in HashSet/Dictionary — verify they are distinct.
        var sharedId = Guid.NewGuid();
        var order = new OrderEntity(sharedId);
        var customer = new CustomerEntity(sharedId);

        order.GetHashCode().Should().NotBe(customer.GetHashCode());
    }

    [Fact]
    public void Entities_SameType_SameId_HaveSameHashCode()
    {
        var id = Guid.NewGuid();
        var a = new TestEntity(id);
        var b = new TestEntity(id);

        a.GetHashCode().Should().Be(b.GetHashCode());
    }
}

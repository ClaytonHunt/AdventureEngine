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
}

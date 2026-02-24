using AdventureEngine.SharedKernel.Primitives;
using FluentAssertions;

namespace AdventureEngine.SharedKernel.Tests.Primitives;

public sealed class AggregateRootTests
{
    private sealed record TestEvent(Guid EventId, DateTimeOffset OccurredOn) : IDomainEvent;

    private sealed class TestAggregate(Guid id) : AggregateRoot<Guid>(id)
    {
        public void RaiseTestEvent()
            => AddDomainEvent(new TestEvent(Guid.CreateVersion7(), DateTimeOffset.UtcNow));
    }

    [Fact]
    public void NewAggregate_HasNoDomainEvents()
    {
        var aggregate = new TestAggregate(Guid.NewGuid());

        aggregate.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void RaisingEvent_AddsToDomainEvents()
    {
        var aggregate = new TestAggregate(Guid.NewGuid());
        aggregate.RaiseTestEvent();

        aggregate.DomainEvents.Should().HaveCount(1);
    }

    [Fact]
    public void RaisingMultipleEvents_AllAppendedInOrder()
    {
        var aggregate = new TestAggregate(Guid.NewGuid());
        aggregate.RaiseTestEvent();
        aggregate.RaiseTestEvent();
        aggregate.RaiseTestEvent();

        aggregate.DomainEvents.Should().HaveCount(3);
    }

    [Fact]
    public void ClearDomainEvents_RemovesAllEvents()
    {
        var aggregate = new TestAggregate(Guid.NewGuid());
        aggregate.RaiseTestEvent();
        aggregate.RaiseTestEvent();

        aggregate.ClearDomainEvents();

        aggregate.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void DomainEvents_ReturnsCachedReadOnlyWrapper()
    {
        var aggregate = new TestAggregate(Guid.NewGuid());

        var first = aggregate.DomainEvents;
        var second = aggregate.DomainEvents;

        first.Should().BeSameAs(second);
    }

    [Fact]
    public void ClearDomainEvents_InvalidatesCachedWrapper()
    {
        var aggregate = new TestAggregate(Guid.NewGuid());
        aggregate.RaiseTestEvent();
        var beforeClear = aggregate.DomainEvents;

        aggregate.ClearDomainEvents();
        var afterClear = aggregate.DomainEvents;

        // After clear and re-access, a new (empty) wrapper is returned
        afterClear.Should().BeEmpty();
        afterClear.Should().NotBeSameAs(beforeClear);
    }

    [Fact]
    public void AggregateRoot_ImplementsIDomainEventContainer()
    {
        typeof(TestAggregate).Should().Implement(typeof(IDomainEventContainer));
    }

    [Fact]
    public void AggregateRoot_InheritsFromEntity()
    {
        typeof(TestAggregate).Should().BeDerivedFrom(typeof(Entity<Guid>));
    }
}

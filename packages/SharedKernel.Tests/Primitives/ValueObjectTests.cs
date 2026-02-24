using AdventureEngine.SharedKernel.Primitives;
using FluentAssertions;

namespace AdventureEngine.SharedKernel.Tests.Primitives;

public sealed class ValueObjectTests
{
    private sealed class Money(decimal amount, string currency) : ValueObject
    {
        protected override IEnumerable<object?> GetEqualityComponents()
        {
            yield return amount;
            yield return currency;
        }
    }

    [Fact]
    public void ValueObjects_WithSameComponents_AreEqual()
    {
        var a = new Money(10.00m, "USD");
        var b = new Money(10.00m, "USD");

        a.Should().Be(b);
        (a == b).Should().BeTrue();
    }

    [Fact]
    public void ValueObjects_WithDifferentComponents_AreNotEqual()
    {
        var a = new Money(10.00m, "USD");
        var b = new Money(10.00m, "EUR");

        a.Should().NotBe(b);
        (a != b).Should().BeTrue();
    }

    [Fact]
    public void ValueObject_GetHashCode_IsConsistentForSameInstance()
    {
        var money = new Money(10.00m, "USD");

        money.GetHashCode().Should().Be(money.GetHashCode());
    }

    [Fact]
    public void ValueObjects_WithSameComponents_HaveSameHashCode()
    {
        var a = new Money(10.00m, "USD");
        var b = new Money(10.00m, "USD");

        a.GetHashCode().Should().Be(b.GetHashCode());
    }

    [Fact]
    public void ValueObject_Equals_Null_ReturnsFalse()
    {
        var money = new Money(10.00m, "USD");

        money.Equals(null).Should().BeFalse();
        (money == null).Should().BeFalse();
    }

    [Fact]
    public void ValueObjects_WithDifferentTypes_AreNotEqual()
    {
        var money = new Money(10.00m, "USD");

        money.Equals("not a value object").Should().BeFalse();
    }
}

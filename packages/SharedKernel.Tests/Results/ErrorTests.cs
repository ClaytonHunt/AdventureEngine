using AdventureEngine.SharedKernel.Results;
using FluentAssertions;

namespace AdventureEngine.SharedKernel.Tests.Results;

public sealed class ErrorTests
{
    [Fact]
    public void NotFound_HasExpectedCodeAndMessage()
    {
        var error = Error.NotFound("Product");

        error.Code.Should().Be("Product.NotFound");
        error.Message.Should().Be("Product was not found.");
        error.InternalDetail.Should().BeNull();
    }

    [Fact]
    public void Validation_HasExpectedCodeAndMessage()
    {
        var error = Error.Validation("Email", "must be a valid email address");

        error.Code.Should().Be("Email.Validation");
        error.Message.Should().Be("must be a valid email address");
        error.InternalDetail.Should().BeNull();
    }

    [Fact]
    public void Conflict_HasExpectedCodeAndMessage()
    {
        var error = Error.Conflict("Order");

        error.Code.Should().Be("Order.Conflict");
        error.Message.Should().Be("Order already exists.");
        error.InternalDetail.Should().BeNull();
    }

    [Fact]
    public void Unexpected_DefaultMessage_IsGenericAndSafe()
    {
        var error = Error.Unexpected();

        error.Code.Should().Be("Unexpected");
        error.Message.Should().Be("An unexpected error occurred.");
        error.InternalDetail.Should().BeNull();
    }

    [Fact]
    public void Unexpected_WithCustomUserMessage_UsesProvidedMessage()
    {
        var error = Error.Unexpected(userMessage: "Something went wrong, please try again.");

        error.Message.Should().Be("Something went wrong, please try again.");
        error.InternalDetail.Should().BeNull();
    }

    [Fact]
    public void Unexpected_WithInternalDetail_KeepsDetailSeparateFromMessage()
    {
        const string internalDetail = "NullReferenceException in UserRepository.GetByIdAsync at line 42";
        var error = Error.Unexpected(
            userMessage: "Something went wrong.",
            internalDetail: internalDetail);

        // User-facing message is safe and generic
        error.Message.Should().Be("Something went wrong.");
        // Internal detail is captured for logging
        error.InternalDetail.Should().Be(internalDetail);
        // CRITICAL: the internal detail must NOT appear in the user-facing message
        error.Message.Should().NotContain("NullReferenceException");
        error.Message.Should().NotContain("UserRepository");
    }

    [Fact]
    public void Error_IsRecord_WithValueEquality()
    {
        var a = Error.NotFound("User");
        var b = Error.NotFound("User");

        a.Should().Be(b);
        (a == b).Should().BeTrue();
    }

    [Fact]
    public void Error_WithDifferentCodes_AreNotEqual()
    {
        var a = Error.NotFound("User");
        var b = Error.NotFound("Product");

        a.Should().NotBe(b);
    }
}

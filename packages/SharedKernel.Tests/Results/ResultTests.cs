using AdventureEngine.SharedKernel.Results;
using FluentAssertions;

namespace AdventureEngine.SharedKernel.Tests.Results;

public sealed class ResultTests
{
    // --- Generic Result<T> ---

    [Fact]
    public void GenericResult_Success_IsSuccess()
    {
        var result = Result<int>.Success(42);

        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Value.Should().Be(42);
        result.Error.Should().BeNull();
    }

    [Fact]
    public void GenericResult_Failure_IsFailure()
    {
        var error = Error.NotFound("User");
        var result = Result<int>.Failure(error);

        result.IsFailure.Should().BeTrue();
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(error);
        result.Value.Should().Be(default);
    }

    [Fact]
    public void GenericResult_ImplicitOperator_FromValue_CreatesSuccess()
    {
        Result<string> result = "hello";

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("hello");
    }

    [Fact]
    public void GenericResult_ImplicitOperator_FromError_CreatesFailure()
    {
        Result<string> result = Error.NotFound("Item");

        result.IsFailure.Should().BeTrue();
        result.Error!.Code.Should().Be("Item.NotFound");
    }

    [Fact]
    public void GenericResult_Match_OnSuccess_CallsOnSuccess()
    {
        var result = Result<int>.Success(10);

        var output = result.Match(v => v * 2, _ => -1);

        output.Should().Be(20);
    }

    [Fact]
    public void GenericResult_Match_OnFailure_CallsOnFailure()
    {
        var result = Result<int>.Failure(Error.Unexpected());

        var output = result.Match(_ => 1, _ => -1);

        output.Should().Be(-1);
    }

    // --- Non-generic Result ---

    [Fact]
    public void NonGenericResult_Success_IsSuccess()
    {
        var result = Result.Success();

        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void NonGenericResult_Failure_IsFailure()
    {
        var error = Error.Validation("Name", "is required");
        var result = Result.Failure(error);

        result.IsFailure.Should().BeTrue();
        result.IsSuccess.Should().BeFalse();
        result.Error!.Code.Should().Be("Name.Validation");
    }

    [Fact]
    public void NonGenericResult_ImplicitOperator_FromError_CreatesFailure()
    {
        Result result = Error.Conflict("Order");

        result.IsFailure.Should().BeTrue();
        result.Error!.Code.Should().Be("Order.Conflict");
    }

    [Fact]
    public void NonGenericResult_Match_OnSuccess_CallsOnSuccess()
    {
        var result = Result.Success();

        var output = result.Match(() => "ok", _ => "fail");

        output.Should().Be("ok");
    }

    [Fact]
    public void NonGenericResult_Match_OnFailure_CallsOnFailure()
    {
        var result = Result.Failure(Error.Unexpected());

        var output = result.Match(() => "ok", _ => "fail");

        output.Should().Be("fail");
    }
}

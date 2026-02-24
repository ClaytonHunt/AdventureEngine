using System.Runtime.CompilerServices;

namespace AdventureEngine.SharedKernel.Results;

/// <summary>
/// A discriminated union representing the outcome of an operation that returns a value.
/// Use <see cref="Result"/> (non-generic) for void operations.
/// </summary>
/// <typeparam name="T">The type of the success value.</typeparam>
public sealed class Result<T>
{
    /// <summary>The success value. Only valid when <see cref="IsSuccess"/> is <c>true</c>.</summary>
    public T? Value { get; }

    /// <summary>The error. Only valid when <see cref="IsSuccess"/> is <c>false</c>.</summary>
    public Error? Error { get; }

    /// <summary><c>true</c> if the operation succeeded; <c>false</c> otherwise.</summary>
    public bool IsSuccess { get; }

    /// <summary><c>true</c> if the operation failed; <c>false</c> otherwise.</summary>
    public bool IsFailure => !IsSuccess;

    private Result(T value)   { Value = value;  IsSuccess = true; }
    private Result(Error error) { Error = error; IsSuccess = false; }

    /// <summary>Creates a successful result wrapping the given <paramref name="value"/>.</summary>
    public static Result<T> Success(T value) => new(value);

    /// <summary>Creates a failed result wrapping the given <paramref name="error"/>.</summary>
    public static Result<T> Failure(Error error) => new(error);

    /// <summary>Implicitly wraps a value in a successful result.</summary>
    public static implicit operator Result<T>(T value) => Success(value);

    /// <summary>Implicitly wraps an error in a failed result.</summary>
    public static implicit operator Result<T>(Error error) => Failure(error);

    /// <summary>
    /// Exhaustively handles both outcomes. Calls <paramref name="onSuccess"/> when the result
    /// is successful, or <paramref name="onFailure"/> when it has failed.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<Error, TOut> onFailure)
        => IsSuccess ? onSuccess(Value!) : onFailure(Error!);
}

/// <summary>
/// A discriminated union representing the outcome of an operation that returns no value.
/// Use <see cref="Result{T}"/> when the operation returns data.
/// </summary>
public sealed class Result
{
    /// <summary>The error. Only valid when <see cref="IsSuccess"/> is <c>false</c>.</summary>
    public Error? Error { get; }

    /// <summary><c>true</c> if the operation succeeded; <c>false</c> otherwise.</summary>
    public bool IsSuccess { get; }

    /// <summary><c>true</c> if the operation failed; <c>false</c> otherwise.</summary>
    public bool IsFailure => !IsSuccess;

    private Result()            { IsSuccess = true; }
    private Result(Error error) { Error = error; IsSuccess = false; }

    /// <summary>Creates a successful result.</summary>
    public static Result Success() => new();

    /// <summary>Creates a failed result wrapping the given <paramref name="error"/>.</summary>
    public static Result Failure(Error error) => new(error);

    /// <summary>Implicitly wraps an error in a failed result.</summary>
    public static implicit operator Result(Error error) => Failure(error);

    /// <summary>
    /// Exhaustively handles both outcomes. Calls <paramref name="onSuccess"/> when the result
    /// is successful, or <paramref name="onFailure"/> when it has failed.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public TOut Match<TOut>(Func<TOut> onSuccess, Func<Error, TOut> onFailure)
        => IsSuccess ? onSuccess() : onFailure(Error!);
}

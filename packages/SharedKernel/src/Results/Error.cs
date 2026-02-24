namespace AdventureEngine.SharedKernel.Results;

/// <summary>
/// Represents a domain or application error.
/// <para>
/// <b>SECURITY:</b> <see cref="Message"/> is safe to surface to API consumers (user-facing).
/// <see cref="InternalDetail"/> must <b>NEVER</b> leave the service boundary — log it only,
/// never include it in HTTP responses.
/// </para>
/// </summary>
public sealed record Error(string Code, string Message, string? InternalDetail = null)
{
    /// <summary>Creates a "not found" error for the given resource.</summary>
    public static Error NotFound(string resource)
        => new($"{resource}.NotFound", $"{resource} was not found.");

    /// <summary>Creates a validation error for the given field with a reason.</summary>
    public static Error Validation(string field, string reason)
        => new($"{field}.Validation", reason);

    /// <summary>Creates a conflict error indicating the resource already exists.</summary>
    public static Error Conflict(string resource)
        => new($"{resource}.Conflict", $"{resource} already exists.");

    /// <summary>
    /// Creates an unexpected/internal error with a generic user-facing message.
    /// <para>
    /// Pass <paramref name="internalDetail"/> for structured logging.
    /// It will NOT be sent to API consumers — include exception messages, stack traces,
    /// or other diagnostic context here.
    /// </para>
    /// </summary>
    public static Error Unexpected(
        string userMessage = "An unexpected error occurred.",
        string? internalDetail = null)
        => new("Unexpected", userMessage, internalDetail);
}

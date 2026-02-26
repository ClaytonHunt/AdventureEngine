namespace AdventureEngine.Api.Features.Cors;

public interface ICorsStartupValidator
{
    void Validate(ILogger logger);
}

public sealed class CorsStartupValidator(IReadOnlyCollection<string> invalidOrigins, bool isEmpty, bool isDevelopment) : ICorsStartupValidator
{
    public void Validate(ILogger logger)
    {
        if (invalidOrigins.Count > 0)
        {
            var message =
                $"CORS: Invalid AllowedOrigins entries: {string.Join(", ", invalidOrigins)}. " +
                "Each origin must be an absolute http/https origin with host only (no path/query/fragment).";

            if (!isDevelopment)
            {
                throw new InvalidOperationException(message);
            }

            logger.LogWarning("{Code} {Message}", "CORS_CONFIG_WARN", message);
        }

        if (isEmpty)
        {
            var message =
                "CORS: AllowedOrigins is empty after validation. Configure AllowedOrigins__0, " +
                "AllowedOrigins__1, etc. with absolute http/https origins.";

            if (!isDevelopment)
            {
                throw new InvalidOperationException(message);
            }

            logger.LogWarning("{Code} {Message}", "CORS_CONFIG_WARN", message);
        }
    }
}

namespace AdventureEngine.Api.Features.HealthCheck;

/// <summary>
/// Sanitized response body for the Health Check endpoint.
/// Serialized to camelCase JSON by the global HttpJsonOptions policy.
/// </summary>
public record HealthResponse(string Status);

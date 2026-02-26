namespace AdventureEngine.Api.Features.Cors;

public sealed class CorsOptions
{
    public const string SectionName = "AllowedOrigins";
    public string[] AllowedOrigins { get; init; } = [];
}
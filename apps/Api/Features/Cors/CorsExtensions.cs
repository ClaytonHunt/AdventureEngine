using Microsoft.Extensions.Options;

namespace AdventureEngine.Api.Features.Cors;

public static class CorsExtensions
{
    public static IServiceCollection AddFrontendCors(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        var configuredOrigins = configuration
            .GetSection(CorsOptions.SectionName)
            .Get<string[]>() ?? [];

        var validOrigins = new List<string>();
        var invalidOrigins = new List<string>();

        foreach (var raw in configuredOrigins)
        {
            if (string.IsNullOrWhiteSpace(raw))
            {
                invalidOrigins.Add("<empty>");
                continue;
            }

            var trimmed = raw.Trim();

            if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) ||
                string.IsNullOrWhiteSpace(uri.Host) ||
                !string.IsNullOrEmpty(uri.PathAndQuery.Trim('/')) ||
                !string.IsNullOrEmpty(uri.Fragment))
            {
                invalidOrigins.Add(trimmed);
                continue;
            }

            validOrigins.Add(uri.GetLeftPart(UriPartial.Authority));
        }

        var allowedOrigins = validOrigins
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        services.AddSingleton(Options.Create(new CorsOptions { AllowedOrigins = allowedOrigins }));

        services.AddCors(options =>
            options.AddPolicy("FrontendOrigins", policy =>
            {
                if (allowedOrigins.Length > 0)
                {
                    policy.WithOrigins(allowedOrigins)
                        .AllowAnyMethod()
                        .AllowAnyHeader();
                }
            }));

        services.AddSingleton<ICorsStartupValidator>(new CorsStartupValidator(invalidOrigins, allowedOrigins.Length == 0, environment.IsDevelopment()));

        return services;
    }
}

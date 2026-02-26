using AdventureEngine.Api.Features.HealthCheck;
using Microsoft.AspNetCore.Http;

namespace AdventureEngine.Api.Tests.Features.HealthCheck;

internal sealed class ThrowingHealthHandler : IHealthHandler
{
    public IResult Handle() => throw new InvalidOperationException("sensitive-stack-detail");
}

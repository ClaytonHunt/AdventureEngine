# Features

This directory contains all API feature slices, organised by domain.

## Convention: Vertical Slice Architecture

Each feature slice lives in its own subfolder and owns its entire request/response pipeline:

```
Features/
└── {Domain}/
    ├── {Feature}Endpoint.cs      # Minimal API endpoint registration
    ├── {Feature}Request.cs       # Input model / command
    ├── {Feature}Response.cs      # Output model
    └── {Feature}Handler.cs       # Business logic (optional — use for complex cases)
```

## Composition Root Rule

`Program.cs` is the **only** composition root. Do not register infrastructure services
(DbContext, repositories, external HTTP clients) from inside a Features subfolder.
Register in `Program.cs` and inject via constructor or endpoint handler parameters.

## OpenAPI Documentation

All endpoints **must** include `summary` and `description` in their route group or
`WithOpenApi()` call. These fields are the primary accessibility surface for the Scalar UI
and are treated as required — not optional.

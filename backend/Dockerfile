# syntax=docker/dockerfile:1

# ─── Build ────────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first (cached unless the csproj changes)
COPY WoodenHousesAPI/WoodenHousesAPI.csproj WoodenHousesAPI/
RUN dotnet restore WoodenHousesAPI/WoodenHousesAPI.csproj

# Build + publish
COPY WoodenHousesAPI/ WoodenHousesAPI/
RUN dotnet publish WoodenHousesAPI/WoodenHousesAPI.csproj \
    -c Release -o /app --no-restore /p:UseAppHost=false

# ─── Runtime ──────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user (no apt needed — the health probe uses the app's own runtime).
RUN adduser --system --group --uid 1001 appuser

COPY --from=build /app ./
USER appuser

ENV ASPNETCORE_URLS=http://0.0.0.0:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_EnableDiagnostics=0
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD ["dotnet", "WoodenHousesAPI.dll", "--healthcheck"]

ENTRYPOINT ["dotnet", "WoodenHousesAPI.dll"]

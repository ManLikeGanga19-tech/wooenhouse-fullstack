# ── Build stage ────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["WoodenHousesAPI.csproj", "."]
RUN dotnet restore --no-cache

COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Runtime stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create uploads directory (Render Disk mounts here)
RUN mkdir -p wwwroot/uploads/projects

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "WoodenHousesAPI.dll"]

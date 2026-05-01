using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Resend;
using Serilog;
using SerilogLog = Serilog.Log;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Middleware;
using WoodenHousesAPI.Services;

// ─── Serilog early init (captures startup errors too) ────────────────────────
SerilogLog.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ─── Kestrel — raise body size limit for large image/video uploads ────────
    builder.WebHost.ConfigureKestrel(opts =>
        opts.Limits.MaxRequestBodySize = 200L * 1024 * 1024); // 200 MB

    // ─── Serilog ─────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, lc) => lc
        .ReadFrom.Configuration(ctx.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "WoodenHousesAPI")
        .WriteTo.Console(outputTemplate:
            "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
        .WriteTo.File(
            path: "logs/api-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30,
            outputTemplate:
                "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}"
        )
    );

    // ─── Database ─────────────────────────────────────────────────────────────
    builder.Services.AddDbContext<AppDbContext>(options =>
    {
        options.UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            npgsql => npgsql.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null
            )
        );

        // EnableSensitiveDataLogging intentionally omitted — keep SQL params out of logs
    });

    // ─── Authentication (JWT) ─────────────────────────────────────────────────
    var jwtKey = builder.Configuration["Jwt:Key"]
        ?? throw new InvalidOperationException("Jwt:Key is not configured.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            // Keep original JWT claim names (email, sub, etc.) instead of
            // mapping them to the long ClaimTypes.* URIs
            options.MapInboundClaims = false;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = builder.Configuration["Jwt:Issuer"],
                ValidAudience            = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ClockSkew                = TimeSpan.Zero, // No tolerance — token expires exactly on time
            };

            // Also read JWT from httpOnly cookie (for browser clients)
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = ctx =>
                {
                    // Try Authorization header first, then fall back to cookie
                    if (ctx.Request.Cookies.TryGetValue("wh_access_token", out var cookieToken))
                        ctx.Token ??= cookieToken;
                    return Task.CompletedTask;
                },
            };
        });

    builder.Services.AddAuthorization();

    // ─── CORS ─────────────────────────────────────────────────────────────────
    var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]
        ?.Split(",", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
        ?? ["http://localhost:3000"];

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials() // Required for httpOnly cookies
        );
    });

    // ─── Rate Limiting ────────────────────────────────────────────────────────
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        var isTest = builder.Environment.IsEnvironment("Testing");

        // Strict: contact form & auth — 5 req/min (unlimited in tests)
        options.AddFixedWindowLimiter("strict", o =>
        {
            o.PermitLimit          = isTest ? int.MaxValue : 5;
            o.Window               = TimeSpan.FromMinutes(1);
            o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            o.QueueLimit           = isTest ? int.MaxValue : 0;
        });

        // Standard: general API — 60 req/min (unlimited in tests)
        options.AddFixedWindowLimiter("standard", o =>
        {
            o.PermitLimit          = isTest ? int.MaxValue : 60;
            o.Window               = TimeSpan.FromMinutes(1);
            o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            o.QueueLimit           = isTest ? int.MaxValue : 2;
        });
    });

    // ─── Response Compression ─────────────────────────────────────────────────
    builder.Services.AddResponseCompression(options =>
    {
        options.EnableForHttps = true;
        options.Providers.Add<BrotliCompressionProvider>();
        options.Providers.Add<GzipCompressionProvider>();
    });

    // ─── Response Caching ─────────────────────────────────────────────────────
    builder.Services.AddResponseCaching();

    // ─── HTTP Context ─────────────────────────────────────────────────────────
    builder.Services.AddHttpContextAccessor();

    // ─── Memory Cache ─────────────────────────────────────────────────────────
    builder.Services.AddMemoryCache();

    // ─── Application Services ─────────────────────────────────────────────────
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IEmailService, EmailService>();
    builder.Services.AddScoped<IAuditService, AuditService>();
    builder.Services.AddHttpClient<IRecaptchaService, RecaptchaService>();

    // Resend — transactional email via HTTPS (replaces SMTP which is blocked on Render)
    builder.Services.AddOptions();
    builder.Services.AddHttpClient<ResendClient>();
    builder.Services.Configure<ResendClientOptions>(o =>
    {
        o.ApiToken = builder.Configuration["Resend:ApiKey"] ?? string.Empty;
    });

    // Use Cloudinary in production (Render has an ephemeral filesystem).
    // Fall back to local disk storage when Cloudinary is not configured (dev).
    if (!string.IsNullOrWhiteSpace(builder.Configuration["Cloudinary:CloudName"]))
        builder.Services.AddScoped<IFileService, CloudinaryService>();
    else
        builder.Services.AddScoped<IFileService, FileService>();

    // ─── Controllers ─────────────────────────────────────────────────────────
    builder.Services.AddControllers(options =>
    {
        // Return 406 if client requests unsupported format
        options.ReturnHttpNotAcceptable = true;
    })
    .AddJsonOptions(options =>
    {
        // Break circular references (e.g. Quote → LineItems → Quote)
        // instead of throwing an exception
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

    // ─── Health Checks ────────────────────────────────────────────────────────
    builder.Services.AddHealthChecks()
        .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

    // ─── Swagger (Dev + Staging only) ─────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title       = "Wooden Houses Kenya API",
            Version     = "v1",
            Description = "REST API for woodenhouseskenya.com — public + admin endpoints.",
            Contact     = new OpenApiContact
            {
                Name  = "Wooden Houses Kenya",
                Email = "info@woodenhouseskenya.com",
            },
        });

        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            In          = ParameterLocation.Header,
            Description = "Enter: Bearer {token}",
            Name        = "Authorization",
            Type        = SecuritySchemeType.Http,
            Scheme      = "bearer",
            BearerFormat = "JWT",
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id   = "Bearer",
                    },
                },
                Array.Empty<string>()
            },
        });
    });

    // ─── Build App ────────────────────────────────────────────────────────────
    var app = builder.Build();

    // ─── Run Migrations + Seed ────────────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var db     = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        try
        {
            logger.LogInformation("Applying database migrations...");
            await db.Database.MigrateAsync();
            logger.LogInformation("Migrations applied successfully.");

            await DatabaseSeeder.SeedAsync(db, config, logger);
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "Failed to apply migrations. Shutting down.");
            throw;
        }
    }

    // ─── Middleware Pipeline (ORDER MATTERS) ──────────────────────────────────

    // 1. Exception handler — must be first so it catches everything below
    app.UseMiddleware<ExceptionMiddleware>();

    // 2. Security headers
    app.UseMiddleware<SecurityHeadersMiddleware>();

    // 3. HTTPS redirect in production
    if (!app.Environment.IsDevelopment())
        app.UseHttpsRedirection();

    // 4. Response compression
    app.UseResponseCompression();

    // 5. Response caching
    app.UseResponseCaching();

    // 6. Serilog request logging
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate =
            "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    });

    // 7. Swagger — only in non-production environments
    if (!app.Environment.IsProduction())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Wooden Houses Kenya API v1");
            c.RoutePrefix = "swagger";
        });
    }

    // 8. Static files (uploaded images)
    app.UseStaticFiles();

    // 9. Rate limiting
    app.UseRateLimiter();

    // 10. CORS — before auth
    app.UseCors("AllowFrontend");

    // 11. Auth
    app.UseAuthentication();
    app.UseAuthorization();

    // 12. Health check endpoint
    app.MapHealthChecks("/health");

    // 13. Controllers
    app.MapControllers();

    SerilogLog.Information("Wooden Houses Kenya API starting on {Environment}",
        app.Environment.EnvironmentName);

    await app.RunAsync();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    SerilogLog.Fatal(ex, "Application startup failed.");
}
finally
{
    SerilogLog.CloseAndFlush();
}

// Required so WebApplicationFactory<Program> works in integration tests
public partial class Program { }

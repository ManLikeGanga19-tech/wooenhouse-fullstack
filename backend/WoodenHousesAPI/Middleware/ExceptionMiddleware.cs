using System.Net;
using System.Text.Json;

namespace WoodenHousesAPI.Middleware;

/// <summary>
/// Catches all unhandled exceptions and returns a consistent JSON error response.
/// Hides internal details in production — never leak stack traces.
/// </summary>
public class ExceptionMiddleware(
    RequestDelegate next,
    ILogger<ExceptionMiddleware> logger,
    IWebHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception on {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message) = exception switch
        {
            ArgumentNullException      => (HttpStatusCode.BadRequest,     "Invalid request data."),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized,  "Unauthorized."),
            KeyNotFoundException        => (HttpStatusCode.NotFound,      "Resource not found."),
            InvalidOperationException e => (HttpStatusCode.BadRequest,    e.Message),
            _                          => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };

        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            status  = (int)statusCode,
            message,
            // Only expose detail in Development
            detail  = env.IsDevelopment() ? exception.Message : null,
            traceId = context.TraceIdentifier,
        };

        return context.Response.WriteAsync(
            JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            })
        );
    }
}

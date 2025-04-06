using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Repository;
using Microsoft.AspNetCore.WebSockets;
using System.Net.WebSockets;
using VSFrontendBackend.Server.Controllers;
using System.IO;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Diagnostics;
using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Configure Kestrel for large file uploads
builder.WebHost.ConfigureKestrel(options =>
{
    // Set the limits for the entire application
    options.Limits.MaxRequestBodySize = 629145600; // 600MB in bytes
});

// Configure IIS for large file uploads
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 629145600; // 600MB in bytes
});

// Add services to the container.
builder.Services.AddSingleton<IGameRepository, GameRepository>(); // Register repository as singleton
builder.Services.AddSingleton<IGameService, GameService>(); // Register service as singleton

// Register file services
string fileStoragePath = Path.Combine(Directory.GetCurrentDirectory(), "FileStorage");
builder.Services.AddSingleton<IFilesRepository>(new FilesRepository(fileStoragePath));
builder.Services.AddSingleton<IFilesService, FilesService>();

// Configure request size limits for the entire application
builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 629145600; // 600MB in bytes
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 629145600; // 600MB in bytes
    options.ValueLengthLimit = 629145600; // 600MB in bytes
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add WebSocket support with a shorter keep-alive interval
builder.Services.AddWebSockets(options =>
{
    options.KeepAliveInterval = TimeSpan.FromSeconds(30); // Shorter interval for more reliable connection
});

// Add CORS with a more permissive policy for development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", builder =>
    {
        builder.WithOrigins("https://localhost:53392", "https://localhost:7299", "localhost:7299")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials(); // for cookies/auth
    });
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // This preserves the property names exactly as defined in the C# models
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// The order of middleware is important
app.UseHttpsRedirection();

// CORS should come before routing but after redirections
app.UseCors("AllowReactApp");

app.UseRouting(); // Add this explicitly

// Add WebSocket middleware with shorter keep-alive interval
app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(30) // Shorter interval for more reliable connection
});

app.UseAuthorization();

// Static files middleware
app.UseDefaultFiles();
app.UseStaticFiles();

// Map controllers AFTER UseWebSockets
app.MapControllers();

// Add global exception handler
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Unhandled exception occurred");
        
        // Instead of re-throwing, return a 500 response
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsync($"An error occurred: {ex.Message}");
    }
});

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "text/plain";
        var errorFeature = context.Features.Get<IExceptionHandlerFeature>();
        if (errorFeature != null)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(errorFeature.Error, "Unhandled exception");
            Debug.WriteLine("ErrorFeature: " + errorFeature.Error);
            await context.Response.WriteAsync("An unexpected error occurred.");
        }
    });
});

app.Run();
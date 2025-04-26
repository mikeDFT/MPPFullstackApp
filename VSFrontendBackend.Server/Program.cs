using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Repository;
using VSFrontendBackend.Server.Controllers;
using Microsoft.AspNetCore.WebSockets;
using System.Net.WebSockets;
using System.IO;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Diagnostics;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using System;
using VSFrontendBackend.Server.Utils;

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

// Making the repositories using ER and services available for dependency injection
builder.Services.AddScoped<ICompanyRepository, CompanyRepository>();
builder.Services.AddScoped<IGameRepository, GameRepository>();
builder.Services.AddScoped<ILogRepository, LogRepository>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<ILogService, LogService>();

// Register file services
string fileStoragePath = Path.Combine(Directory.GetCurrentDirectory(), "FileStorage");
builder.Services.AddSingleton<IFilesRepository>(new FilesRepository(fileStoragePath));
builder.Services.AddSingleton<IFilesService, FilesService>();

// Change this line from AddSingleton to AddScoped
builder.Services.AddScoped<VSFrontendBackend.Server.Repository.CompanyRepository>();

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
        // Get client URL from environment variables or use default
        string clientUrl = Environment.GetEnvironmentVariable("CLIENT_URL") ?? 
            $"http://{Environment.GetEnvironmentVariable("SERVER_IP") ?? "192.168.10.160"}:{Environment.GetEnvironmentVariable("CLIENT_PORT") ?? "53392"}";
        
        // Get server URL from environment variables or use default
        string serverUrl = $"http://{Environment.GetEnvironmentVariable("SERVER_IP") ?? "192.168.10.160"}:{Environment.GetEnvironmentVariable("SERVER_HTTP_PORT") ?? "7299"}";
        
        // Add WebSocket URL
        string wsUrl = $"ws://{Environment.GetEnvironmentVariable("SERVER_IP") ?? "192.168.10.160"}:{Environment.GetEnvironmentVariable("SERVER_HTTP_PORT") ?? "7299"}";
        string wssUrl = $"wss://{Environment.GetEnvironmentVariable("SERVER_IP") ?? "192.168.10.160"}:{Environment.GetEnvironmentVariable("SERVER_HTTP_PORT") ?? "7299"}";
        
        builder.WithOrigins(clientUrl, serverUrl, wsUrl, wssUrl)
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

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.MaxDepth = 10;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<AppDbContext>();
        dbContext.Database.EnsureCreated();
        // Alternatively, you can use Migrations:
        // dbContext.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while creating the database.");
    }
}

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
    KeepAliveInterval = TimeSpan.FromSeconds(30), // Shorter interval for more reliable connection
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
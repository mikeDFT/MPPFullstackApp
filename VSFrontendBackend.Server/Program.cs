using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Repository;
using VSFrontendBackend.Server.Controllers;
using Microsoft.AspNetCore.WebSockets;
using System.Net.WebSockets;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSingleton<IGameRepository, GameRepository>(); // Register repository as singleton
builder.Services.AddSingleton<IGameService, GameService>(); // Register service as singleton

// Controllers should be registered using the standard DI system
// Remove these singleton registrations for controllers
// builder.Services.AddSingleton<GameController>(); 
// builder.Services.AddSingleton<GeneratingGamesController>(); 

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
               .AllowCredentials(); // Add this if you're using cookies/auth
    });
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // This preserves the property names exactly as defined in your C# models
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

// This could be interfering with API calls
// app.MapFallbackToFile("/index.html");

app.Run();
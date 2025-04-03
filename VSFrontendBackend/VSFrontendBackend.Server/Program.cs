var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS with a more permissive policy for development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", builder =>
    {
        builder.WithOrigins("https://localhost:53392")
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

app.UseAuthorization();

// Static files middleware
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

// This could be interfering with API calls
// app.MapFallbackToFile("/index.html");

app.Run();
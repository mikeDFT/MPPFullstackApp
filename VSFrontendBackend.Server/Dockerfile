# using the official .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# copying csproj and restore as distinct layers
COPY ["VSFrontendBackend.Server.csproj", "./"]

RUN dotnet restore "./VSFrontendBackend.Server.csproj" --disable-parallel

# copy everything else and build
COPY . .
RUN dotnet publish "VSFrontendBackend.Server.csproj" -c Release -o /app/publish

# use the official ASP.NET runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Install SQL Server tools for connection testing
RUN apt-get update && apt-get install -y curl gnupg && \
    curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y mssql-tools unixodbc-dev

# Add SQL tools to PATH
ENV PATH="$PATH:/opt/mssql-tools/bin"

# Copy the entrypoint script and set execution permission
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# expose the port the app runs on
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# create FileStorage directory and set it as a volume
RUN mkdir -p /app/FileStorage
VOLUME /app/FileStorage

# Create wwwroot directory and add a placeholder index.html
RUN mkdir -p /app/wwwroot
RUN echo '<!DOCTYPE html><html><body><h1>Backend API Server</h1><p>Server is running</p></body></html>' > /app/wwwroot/index.html

# defining the entry point for the application with the migration script
ENTRYPOINT ["/app/entrypoint.sh"]
# Server Environment Variables Configuration

This project uses environment variables to configure the server URLs. These variables are defined in the client project's `config.js` file and should be referenced when updating the server configuration.

## IIS (Internet Information Services)

IIS (Internet Information Services) is Microsoft's web server software for Windows. It's used to host websites, web applications, and services. In this project:

- **IIS Express**: A lightweight version of IIS designed for local development and testing. It's used when running the application in the "IIS Express" profile.
- **Kestrel**: The cross-platform web server built into ASP.NET Core. It's used when running the application in the "http" or "https" profiles.

## Configuration File

The main configuration file is located at `vsfrontendbackend.client/src/config.js`. It contains the following variables that are relevant to the server:

### Server Configuration
- `SERVER_IP`: The IP address of the server (default: '192.168.40.178')

### Server Ports
- `SERVER_HTTP_PORT`: The HTTP port for the server (default: '5048')
- `SERVER_HTTPS_PORT`: The HTTPS port for the server (default: '7299')
- `SERVER_IIS_PORT`: The IIS port for the server (default: '33367')

### Protocol Configuration
- `HTTP_PROTOCOL`: The HTTP protocol (default: 'http')
- `HTTPS_PROTOCOL`: The HTTPS protocol (default: 'https')

## Environment Variables in launchSettings.json

The `launchSettings.json` file now includes environment variables that can be accessed by the server application:

```json
"environmentVariables": {
  "ASPNETCORE_ENVIRONMENT": "Development",
  "ASPNETCORE_HOSTINGSTARTUPASSEMBLIES": "Microsoft.AspNetCore.SpaProxy",
  "SERVER_IP": "192.168.40.188",
  "SERVER_HTTP_PORT": "5048",
  "SERVER_HTTPS_PORT": "7299",
  "SERVER_IIS_PORT": "33367",
  "CLIENT_PORT": "53392"
}
```

These environment variables can be accessed in your C# code using:

```csharp
string serverIp = Environment.GetEnvironmentVariable("SERVER_IP");
```

## Server Configuration Files

The following files in the server project contain hardcoded values that should be updated if the configuration changes:

1. `Properties/launchSettings.json`: Contains the server URLs and ports
2. `VSFrontendBackend.Server.http`: Contains the server host address

## Updating Server Configuration

To update the server configuration, you need to manually update the following files:

1. `Properties/launchSettings.json`: Update the `applicationUrl` values and environment variables
2. `VSFrontendBackend.Server.http`: Update the `@VSFrontendBackend.Server_HostAddress` value

## appsettings.json

Create a file called appsettings.json in VSFrontendBackend.Server with the following:

```{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=MyAppDb;Trusted_Connection=True;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```
Change the "DefaultConnection" to your SQL Server database connection string


## Example

If you change the server IP address in `vsfrontendbackend.client/src/config.js`:

```javascript
export const SERVER_IP = '192.168.1.100';
```

You should also update the server configuration files:

1. In `Properties/launchSettings.json`:
   ```json
   "applicationUrl": "http://192.168.1.100:5048",
   "environmentVariables": {
     "SERVER_IP": "192.168.1.100"
   }
   ```

2. In `VSFrontendBackend.Server.http`:
   ```
   @VSFrontendBackend.Server_HostAddress = http://192.168.1.100:5048
   ``` 
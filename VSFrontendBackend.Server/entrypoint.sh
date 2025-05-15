#!/bin/bash
set -e

# Wait for SQL Server to be ready - increased retries and timeout
echo "Waiting for SQL Server to be ready..."
for i in {1..60}; do
    if /opt/mssql-tools/bin/sqlcmd -S sqlserver -U sa -P "SaPasswordPlease!" -Q "SELECT 1" &> /dev/null; then
        echo "SQL Server is ready!"
        break
    fi
    echo "Waiting for SQL Server to start ($i/60)..."
    sleep 2
done

# Run the application with the EF migration
echo "Starting application with database migration..."
exec dotnet VSFrontendBackend.Server.dll

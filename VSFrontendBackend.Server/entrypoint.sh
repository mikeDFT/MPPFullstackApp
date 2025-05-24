#!/bin/bash
set -e

# Check if this is Azure deployment
if [ "$AZURE_DEPLOYMENT" = "true" ]; then
    echo "Azure deployment detected - starting application directly"
    dotnet VSFrontendBackend.Server.dll
else
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

    if [ $i -eq 60 ]; then
        echo "SQL Server is not ready after 120 seconds, but starting application anyway"
    fi

    # Run the application with the EF migration
    echo "Starting application with database migration..."
    exec dotnet VSFrontendBackend.Server.dll
fi

#!/bin/bash

# This script helps diagnose and fix issues with deployed containers

# Variables 
RESOURCE_GROUP="VSFrontendBackend"
ACR_NAME="VSFrontendBackendACR"
SQL_SERVER_NAME="VSFrontendBackendSQL"
DATABASE_NAME="VSFrontendBackendDB"
SQL_PASSWORD="VeryComplexAzureSQLPassword123!"

# Get ACR details
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)

# Check container status
echo "📊 Checking container status..."
az container list --resource-group $RESOURCE_GROUP --output table

# Get backend URL
BACKEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name backend --query ipAddress.fqdn --output tsv)
if [ -z "$BACKEND_FQDN" ]; then
    echo "⚠️ Backend container is not running or doesn't have a FQDN"
    exit 1
fi

echo "🔄 Restarting backend container..."
az container delete --resource-group $RESOURCE_GROUP --name backend --yes
az container create \
  --resource-group $RESOURCE_GROUP \
  --name backend \
  --image "$ACR_LOGIN_SERVER/backend:latest" \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label "vs-backend-$RANDOM" \
  --ports 8080 \
  --os-type Linux \
  --environment-variables \
    "ASPNETCORE_ENVIRONMENT=Production" \
    "AZURE_DEPLOYMENT=true" \
    "ConnectionStrings__DefaultConnection=Server=$SQL_SERVER_NAME.database.windows.net;Database=$DATABASE_NAME;User Id=MikeServerAdmin;Password=$SQL_PASSWORD;TrustServerCertificate=True;" \
    "ASPNETCORE_URLS=http://+:8080" \
  --cpu 0.5 \
  --memory 1

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 10

# Get new backend URL
BACKEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name backend --query ipAddress.fqdn --output tsv)

echo "🔄 Restarting frontend container..."
az container delete --resource-group $RESOURCE_GROUP --name frontend --yes
az container create \
  --resource-group $RESOURCE_GROUP \
  --name frontend \
  --image "$ACR_LOGIN_SERVER/frontend:latest" \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --dns-name-label "vs-frontend-$RANDOM" \
  --ports 80 \
  --os-type Linux \
  --environment-variables \
    "SERVER_IP=$BACKEND_FQDN" \
    "SERVER_HTTP_PORT=8080" \
    "AZURE_DEPLOYMENT=true" \
  --cpu 1 \
  --memory 1.5

# Get new frontend URL
FRONTEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name frontend --query ipAddress.fqdn --output tsv)

echo ""
echo "✅ Containers restarted"
echo ""
echo "🌐 Your application URLs:"
echo "Frontend:  http://$FRONTEND_FQDN"
echo "Backend:   http://$BACKEND_FQDN:8080"
echo ""
echo "📝 Testing backend health..."
curl -s "http://$BACKEND_FQDN:8080/health" || echo "❌ Backend health check failed"
echo ""

# Check logs
echo "📜 Backend logs:"
az container logs --resource-group $RESOURCE_GROUP --name backend

echo ""
echo "📜 Frontend logs:"
az container logs --resource-group $RESOURCE_GROUP --name frontend

#!/bin/bash

# Frontend-Only Azure Container Instances Deployment Script

# Variables
RESOURCE_GROUP="VSFrontendBackend"
LOCATION="germanywestcentral"
ACR_NAME="VSFrontendBackendACR"
FRONTEND_CONTAINER_NAME="frontend"
# You might need to manually get this if the backend is not deployed or its FQDN is unknown
# For testing, you can use a placeholder or the actual FQDN if available.
# If the backend is also running in ACI and you know its FQDN:
# BACKEND_FQDN="your-backend-fqdn.germanywestcentral.azurecontainer.io"
# If you are testing locally or with a different backend, adjust accordingly.
# For now, let's assume it might be running and we can try to get it.
# If you are deploying ONLY the frontend for the first time,
# you might need to hardcode this or deploy the backend first.
BACKEND_FQDN_PLACEHOLDER="backend-not-deployed-yet.local" # Placeholder

echo "🚀 Starting Frontend-Only Azure Container Instances deployment..."

# Login check
if ! az account show &> /dev/null; then
    echo "Please login to Azure first: az login"
    exit 1
fi

# Get ACR details
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv 2>/dev/null)
if [ -z "$ACR_LOGIN_SERVER" ]; then
    echo "❌ Failed to get ACR login server. Ensure ACR '$ACR_NAME' exists in resource group '$RESOURCE_GROUP'."
    exit 1
fi
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query username --output tsv 2>/dev/null)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "passwords[0].value" --output tsv 2>/dev/null)

if [ -z "$ACR_USERNAME" ] || [ -z "$ACR_PASSWORD" ]; then
    echo "❌ Failed to get ACR credentials. Ensure admin user is enabled for ACR '$ACR_NAME'."
    exit 1
fi

echo "🏗️ Building and pushing frontend image using ACR Tasks..."
# We pass AZURE_DEPLOYMENT_ARG=true to ensure config.azure.js is used.
# The Dockerfile's ARGs for VITE_SERVER_IP_ARG and VITE_SERVER_HTTP_PORT_ARG will default
# if not set here, which is fine as Nginx handles the proxying at runtime.
az acr build --registry $ACR_NAME --image frontend:latest \
  --file vsfrontendbackend.client/Dockerfile \
  --set AZURE_DEPLOYMENT_ARG=true . # Build context is the root directory

if [ $? -ne 0 ]; then
    echo "❌ Frontend image build failed."
    exit 1
fi
echo "✅ Frontend image built and pushed to ACR"

# Attempt to get Backend FQDN if backend container exists
echo "🔍 Attempting to find backend FQDN..."
BACKEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name backend --query ipAddress.fqdn --output tsv 2>/dev/null)

if [ -z "$BACKEND_FQDN" ]; then
    echo "⚠️ Backend FQDN not found. Using placeholder: $BACKEND_FQDN_PLACEHOLDER"
    echo "⚠️ Frontend might not be able to connect to the backend unless you've configured it manually or the backend is deployed separately."
    ACTUAL_BACKEND_HOST_FOR_NGINX=$BACKEND_FQDN_PLACEHOLDER
else
    echo "✅ Found Backend FQDN: $BACKEND_FQDN"
    ACTUAL_BACKEND_HOST_FOR_NGINX=$BACKEND_FQDN
fi

# Generate a unique DNS name label suffix
RANDOM_STRING=$(LC_ALL=C tr -dc a-z0-9 </dev/urandom | head -c 6)

# Deploy frontend container
echo "🌐 Deploying frontend container ($FRONTEND_CONTAINER_NAME)..."
az container create \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_CONTAINER_NAME \
  --image "$ACR_LOGIN_SERVER/frontend:latest" \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --dns-name-label "vs-frontend-$RANDOM_STRING" \
  --ports 80 \
  --os-type Linux \
  --environment-variables \
    "SERVER_IP=$ACTUAL_BACKEND_HOST_FOR_NGINX" \
    "SERVER_HTTP_PORT=8080" \
    "AZURE_DEPLOYMENT=true" \
  --cpu 1 \
  --memory 1.5

if [ $? -ne 0 ]; then
    echo "❌ Frontend container deployment failed."
    exit 1
fi

# Get frontend URL
echo "⏳ Waiting for frontend to get an FQDN..."
sleep 10 # Initial wait
FRONTEND_FQDN=""
for i in {1..10}; do
    FRONTEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $FRONTEND_CONTAINER_NAME --query ipAddress.fqdn --output tsv 2>/dev/null)
    if [ -n "$FRONTEND_FQDN" ]; then
        echo "✅ Frontend FQDN acquired: $FRONTEND_FQDN"
        break
    fi
    echo "⏳ Waiting for frontend to be assigned an FQDN..."
    sleep 10
done

if [ -z "$FRONTEND_FQDN" ]; then
    echo "❌ Failed to acquire frontend FQDN."
    # Attempt to get logs if FQDN failed, as container might have issues
    echo "📋 Attempting to retrieve logs for '$FRONTEND_CONTAINER_NAME'..."
    az container logs --resource-group $RESOURCE_GROUP --name $FRONTEND_CONTAINER_NAME --follow
    exit 1
fi

echo ""
echo "✅ Frontend Deployment completed!"
echo ""
echo "🌐 Your application URLs:"
echo "Frontend:  http://$FRONTEND_FQDN"
if [ "$ACTUAL_BACKEND_HOST_FOR_NGINX" != "$BACKEND_FQDN_PLACEHOLDER" ]; then
  echo "Backend used by Frontend (Nginx proxy target): http://$ACTUAL_BACKEND_HOST_FOR_NGINX:8080"
fi
echo ""
echo "💡 If you deployed the backend separately, ensure it's accessible at the FQDN shown above for Nginx."
echo "🔍 To view logs for the frontend container:"
echo "az container logs --resource-group $RESOURCE_GROUP --name $FRONTEND_CONTAINER_NAME --follow"
echo ""
echo "🧹 To delete the frontend container:"
echo "az container delete --resource-group $RESOURCE_GROUP --name $FRONTEND_CONTAINER_NAME --yes"
echo ""
echo "🧹 To delete the resource group (includes ACR, SQL etc. if they were in it):"
echo "az group delete --name $RESOURCE_GROUP --yes"


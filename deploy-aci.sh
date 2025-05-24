#!/bin/bash

# Simple Azure Container Instances Deployment Script
# This mirrors your existing docker-compose.yml setup

# Variables - Optimized for European region (GDPR compliance)
RESOURCE_GROUP="VSFrontendBackend"
LOCATION="germanywestcentral"  # GDPR compliant region from the allowed list
ACR_NAME="VSFrontendBackendACR"
SQL_SERVER_NAME="VSFrontendBackendSQL"
DATABASE_NAME="VSFrontendBackendDB"
SQL_PASSWORD="VeryComplexAzureSQLPassword123!"

echo "🚀 Starting Azure Container Instances deployment..."

# Login check
if ! az account show &> /dev/null; then
    echo "Please login to Azure first: az login"
    exit 1
fi

# Check if Docker is running
echo "🐳 Checking if Docker is running..."
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running or not installed. Please start Docker Desktop or install Docker."
    echo "⚠️ Continuing without Docker build steps - you need to manually push images to ACR."
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
    echo "✅ Docker is running"
fi

# Register Microsoft.ContainerInstance resource provider if not already registered
echo "📝 Checking if Microsoft.ContainerInstance provider is registered..."
PROVIDER_STATE=$(az provider show --namespace Microsoft.ContainerInstance --query "registrationState" -o tsv)
if [ "$PROVIDER_STATE" != "Registered" ]; then
    echo "🔄 Registering Microsoft.ContainerInstance provider..."
    az provider register --namespace Microsoft.ContainerInstance
    echo "⏳ Waiting for registration to complete (this may take a few minutes)..."
    az provider show --namespace Microsoft.ContainerInstance --query "registrationState" -o tsv
    echo "✅ Microsoft.ContainerInstance provider registered"
else
    echo "✅ Microsoft.ContainerInstance provider already registered"
fi

# Create resource group (if it doesn't exist)
echo "📦 Creating resource group..."
if ! az group exists --name $RESOURCE_GROUP | grep -q "true"; then
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo "✅ Resource group created"
else
    echo "✅ Resource group already exists, skipping creation"
fi

# Create Azure Container Registry (if it doesn't exist)
echo "🐳 Creating Azure Container Registry..."
if ! az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true
    echo "✅ Container Registry created"
else
    echo "✅ Container Registry already exists, enabling admin"
    az acr update -n $ACR_NAME --admin-enabled true
fi

# Get ACR details
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)

# Create Azure SQL Database (if it doesn't exist)
echo "🗄️ Creating Azure SQL Database..."
SQL_SERVER_EXISTS=$(az sql server show --name $SQL_SERVER_NAME --resource-group $RESOURCE_GROUP &>/dev/null; echo $?)
if [ $SQL_SERVER_EXISTS -ne 0 ]; then
    az sql server create \
      --name $SQL_SERVER_NAME \
      --resource-group $RESOURCE_GROUP \
      --location $LOCATION \
      --admin-user MikeServerAdmin \
      --admin-password $SQL_PASSWORD
    echo "✅ SQL Server created"
else
    echo "✅ SQL Server already exists, skipping creation"
fi

SQL_DB_EXISTS=$(az sql db show --name $DATABASE_NAME --server $SQL_SERVER_NAME --resource-group $RESOURCE_GROUP &>/dev/null; echo $?)
if [ $SQL_DB_EXISTS -ne 0 ]; then
    az sql db create \
      --resource-group $RESOURCE_GROUP \
      --server $SQL_SERVER_NAME \
      --name $DATABASE_NAME \
      --service-objective Basic \
      --edition Basic
    echo "✅ SQL Database created"
else
    echo "✅ SQL Database already exists, skipping creation"
fi

# Ensure Azure services can access SQL (safe to run multiple times)
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0 2>/dev/null

# Build and push images
echo "🔨 Building and pushing Docker images..."

if [ "$DOCKER_AVAILABLE" = true ]; then
    # Try to use Docker if available
    echo "Attempting to use Docker for image building..."
    
    # Try login via Docker
    if az acr login --name $ACR_NAME; then
        echo "✅ Successfully logged in to ACR using Docker"
        
        # Build and push backend
        echo "Building and pushing backend image..."
        if docker build -t "$ACR_LOGIN_SERVER/backend:latest" ./VSFrontendBackend.Server && \
           docker push "$ACR_LOGIN_SERVER/backend:latest"; then
            echo "✅ Backend image built and pushed successfully using Docker"
            BACKEND_PUSHED=true
        else
            echo "⚠️ Failed to build/push backend image using Docker"
            BACKEND_PUSHED=false
        fi
        
        # Build and push frontend
        echo "Building and pushing frontend image..."
        if docker build -t "$ACR_LOGIN_SERVER/frontend:latest" ./vsfrontendbackend.client && \
           docker push "$ACR_LOGIN_SERVER/frontend:latest"; then
            echo "✅ Frontend image built and pushed successfully using Docker"
            FRONTEND_PUSHED=true
        else
            echo "⚠️ Failed to build/push frontend image using Docker"
            FRONTEND_PUSHED=false
        fi
    else
        echo "⚠️ Failed to login to ACR using Docker"
        BACKEND_PUSHED=false
        FRONTEND_PUSHED=false
    fi
else
    echo "ℹ️ Docker not available"
    BACKEND_PUSHED=false
    FRONTEND_PUSHED=false
fi

# Build and push images using ACR Tasks (Docker-less deployment)
echo "🏗️ Building and pushing images using ACR Tasks..."

# Backend Image
echo "Building backend image..."
az acr build --registry $ACR_NAME --image backend:latest --file VSFrontendBackend.Server/Dockerfile VSFrontendBackend.Server

# Frontend Image - Pass build arguments
echo "Building frontend image..."
# Note: BACKEND_FQDN is not known at this build stage.
# The frontend is built to expect SERVER_IP and SERVER_HTTP_PORT as runtime env vars for Nginx.
# Vite itself will use placeholder values or rely on the Nginx proxy.
# We pass AZURE_DEPLOYMENT_ARG=true to ensure config.azure.js is used.
az acr build --registry $ACR_NAME --image frontend:latest \\
  --file vsfrontendbackend.client/Dockerfile \\
  --set AZURE_DEPLOYMENT_ARG=true \\
  vsfrontendbackend.client

echo "✅ Images built and pushed to ACR"

# Check if we have images available
if [ "$BACKEND_PUSHED" != "true" ] || [ "$FRONTEND_PUSHED" != "true" ]; then
    echo "⚠️ Some images were not successfully built and pushed."
    echo "⚠️ Please make sure your images are already in ACR:"
    echo "   - $ACR_LOGIN_SERVER/backend:latest"
    echo "   - $ACR_LOGIN_SERVER/frontend:latest"
    
    # Prompt to continue
    read -p "Do you want to continue deployment? Images must exist in ACR. (y/n): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

# Deploy backend container (equivalent to your docker-compose backend service)
echo "🚀 Deploying backend container..."
az container create \\
  --resource-group $RESOURCE_GROUP \\
  --name backend \\
  --image "$ACR_LOGIN_SERVER/backend:latest" \\
  --registry-login-server $ACR_LOGIN_SERVER \\
  --registry-username "$ACR_USERNAME" \\
  --registry-password "$ACR_PASSWORD" \\
  --dns-name-label "vs-backend-$RANDOM_STRING" \\
  --ports 8080 \\
  --os-type Linux \\
  --environment-variables \\
    "ASPNETCORE_ENVIRONMENT=Production" \\
    "AZURE_DEPLOYMENT=true" \\
    "ConnectionStrings__DefaultConnection=Server=$SQL_SERVER_NAME.database.windows.net;Database=$DATABASE_NAME;User Id=MikeServerAdmin;Password=$SQL_PASSWORD;TrustServerCertificate=True;" \\
    "ASPNETCORE_URLS=http://+:8080" \\
  --cpu 1 \\
  --memory 1.5

# Wait for backend to be ready and get its FQDN
echo "⏳ Waiting for backend to get an FQDN..."
sleep 10  # Initial wait
BACKEND_FQDN=""
for i in {1..10}; do
    BACKEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name backend --query ipAddress.fqdn --output tsv 2>/dev/null)
    if [ -n "$BACKEND_FQDN" ]; then
        echo "✅ Backend FQDN acquired: $BACKEND_FQDN"
        break
    fi
    echo "⏳ Waiting for backend to be assigned an FQDN..."
    sleep 10
done

if [ -z "$BACKEND_FQDN" ]; then
    echo "❌ Failed to acquire backend FQDN. Deployment may not be accessible."
    exit 1
fi

# Deploy frontend container (equivalent to your docker-compose frontend service)
echo "🌐 Deploying frontend container..."
az container create \\
  --resource-group $RESOURCE_GROUP \\
  --name frontend \\
  --image "$ACR_LOGIN_SERVER/frontend:latest" \\
  --registry-login-server $ACR_LOGIN_SERVER \\
  --registry-username "$ACR_USERNAME" \\
  --registry-password "$ACR_PASSWORD" \\
  --dns-name-label "vs-frontend-$RANDOM_STRING" \\
  --ports 80 \\
  --os-type Linux \\
  --environment-variables \\
    "SERVER_IP=$BACKEND_FQDN" \\
    "SERVER_HTTP_PORT=8080" \\
    "AZURE_DEPLOYMENT=true" \\
  --cpu 1 \\
  --memory 1.5

# Get frontend URL
FRONTEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name frontend --query ipAddress.fqdn --output tsv)

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 Your application URLs:"
echo "Frontend:  http://$FRONTEND_FQDN"
echo "Backend:   http://$BACKEND_FQDN:8080"
echo ""
echo "🔍 Test your backend:"
echo "curl http://$BACKEND_FQDN:8080/health"
echo ""
echo "💰 Estimated monthly cost: ~$30-45 USD (GDPR compliant options)"
echo ""
echo "🧹 To delete everything:"
echo "az group delete --name $RESOURCE_GROUP --yes"

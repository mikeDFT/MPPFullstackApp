# Simple Azure Container Instances (ACI) Deployment Guide

Since you already have working Docker containers and `docker-compose.yml`, **Azure Container Instances (ACI)** is the simplest way to deploy to Azure. This approach mirrors your local Docker setup exactly.

## 🚀 Quick Deploy (2 commands)

```powershell
# 1. Login to Azure
az login

# 2. Run the deployment script
.\deploy-aci.ps1
```

That's it! Your app will be running in Azure in ~10-15 minutes.

## 📋 What This Does

This deployment script creates:
- **Azure Container Registry** - Stores your Docker images (exactly like Docker Hub)
- **Azure SQL Database** - Production database  
- **2 Container Instances** - One for frontend, one for backend (just like docker-compose)

## 🌐 How It Works

### Exactly Like Your Local Setup:
```yaml
# Your docker-compose.yml        →    Azure Container Instances
backend:                         →    backend container
  image: backend:latest          →    vsfrontendbackendacr.azurecr.io/backend:latest
  ports: 7299:8080              →    vs-backend-{random}.germanywest.azurecontainer.io:8080
  
frontend:                        →    frontend container  
  image: frontend:latest         →    vsfrontendbackendacr.azurecr.io/frontend:latest
  ports: 53392:80               →    vs-frontend-{random}.germanywest.azurecontainer.io
```

### Database Connection:
- **Local**: `sqlserver` container → **Azure**: `vsfrontendbackend-sql.database.windows.net`
- Same Entity Framework migrations, same data model

## 💰 Cost

**~$50-80/month** for:
- Frontend container: ~$25/month
- Backend container: ~$30/month  
- SQL Database Basic: ~$5/month
- Container Registry: ~$5/month

## 🔧 Managing Your Deployment

### View Running Containers:
```powershell
az container list --resource-group vs-frontend-backend-rg --output table
```

### View Logs:
```powershell
# Backend logs
az container logs --resource-group vs-frontend-backend-rg --name backend

# Frontend logs
az container logs --resource-group vs-frontend-backend-rg --name frontend
```

### Restart Containers:
```powershell
az container restart --resource-group vs-frontend-backend-rg --name backend
az container restart --resource-group vs-frontend-backend-rg --name frontend
```

### Update Your App:
```powershell
# Build new images
docker build -t vsfrontendbackendacr.azurecr.io/backend:latest ./VSFrontendBackend.Server
docker build -t vsfrontendbackendacr.azurecr.io/frontend:latest ./vsfrontendbackend.client

# Push to registry
az acr login --name vsfrontendbackendacr
docker push vsfrontendbackendacr.azurecr.io/backend:latest
docker push vsfrontendbackendacr.azurecr.io/frontend:latest

# Delete and recreate containers (they'll pull the new images)
az container delete --resource-group vs-frontend-backend-rg --name backend --yes
az container delete --resource-group vs-frontend-backend-rg --name frontend --yes

# Re-run the deployment script to recreate with new images
.\deploy-aci.ps1
```

## 🧹 Cleanup

Delete everything:
```powershell
az group delete --name vs-frontend-backend-rg --yes
```

## 🆚 ACI vs Container Apps vs App Service

| Feature | ACI (Your Choice) | Container Apps | App Service |
|---------|-------------------|----------------|-------------|
| **Complexity** | ⭐ Simple | ⭐⭐⭐ Complex | ⭐⭐ Medium |
| **Like docker-compose** | ✅ Yes | ❌ No | ❌ No |
| **Auto-scaling** | ❌ No | ✅ Yes | ✅ Yes |
| **Cost (low traffic)** | ~$50-80 | ~$30-60 | ~$60-100 |
| **Setup time** | 10 mins | 30 mins | 20 mins |

**ACI is perfect for your case because:**
- You already have working Docker containers
- Simple development/demo deployment
- Predictable costs
- No learning curve - works exactly like `docker-compose`

## 🔍 Troubleshooting

### Common Issues:

1. **Container won't start**
   ```powershell
   az container logs --resource-group vs-frontend-backend-rg --name backend
   ```

2. **Can't connect to database**
   - Check if Azure SQL firewall allows Azure services
   - Verify connection string in container environment variables

3. **Frontend can't reach backend**
   - Check if backend URL is correctly set in frontend environment variables
   - Verify backend is accessible: `curl http://your-backend-url:8080/health`

4. **Build issues**
   - Test Docker builds locally first: `docker build -t test ./VSFrontendBackend.Server`
   - Make sure you're in the right directory when running the script

Your deployment approach is the simplest and most straightforward way to get your working Docker setup onto Azure! 🎉

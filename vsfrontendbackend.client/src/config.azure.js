// Azure-specific configuration
export const SERVER_IP = "backend"; // Service name in Azure Container Apps
export const SERVER_HTTP_PORT = 8080;
export const CLIENT_PORT = 80;
export const SERVER_HTTP_URL = `http://${SERVER_IP}:${SERVER_HTTP_PORT}`;

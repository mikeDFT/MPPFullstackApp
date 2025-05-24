// Azure-specific configuration, used when AZURE_DEPLOYMENT=true during build

// Vite provides environment variables through import.meta.env
// These values are baked in at build time by Vite.
// For VITE_SERVER_IP and VITE_SERVER_HTTP_PORT, if not explicitly set via --set in `az acr build`
// (which they currently are not for these specific vars),
// they will take on the defaults from the Dockerfile ARGs (e.g., localhost, 8080)
// or be undefined if no defaults.
const VITE_SERVER_IP_BUILD_TIME = (import.meta.env && import.meta.env.VITE_SERVER_IP) || "vsfrontendbackend-backend-ggf8amawbgfub6a9.westeurope-01.azurewebsites.net";
const VITE_SERVER_HTTP_PORT_BUILD_TIME = (import.meta.env && import.meta.env.VITE_SERVER_HTTP_PORT) || 443;

// SERVER_IP and SERVER_HTTP_PORT are primarily for Nginx runtime configuration.
// The client-side code should make relative API calls.
export const SERVER_IP = VITE_SERVER_IP_BUILD_TIME; // This value is less relevant for client-side JS now
export const SERVER_HTTP_PORT = parseInt(VITE_SERVER_HTTP_PORT_BUILD_TIME, 10); // Also less relevant for client-side JS
export const CLIENT_PORT = 80; // Frontend ACI runs on port 80

// SERVER_HTTP_URL is used by the client to make API calls.
// For Azure, API calls should be relative to the origin (e.g., '/game', '/api/users').
// Nginx, configured at runtime with the actual backend FQDN, will proxy these.
export const SERVER_HTTP_URL = "https://mppbackend-bcf5czg8fffqc7ft.germanywestcentral-01.azurewebsites.net/"; // Full Azure backend URL for direct API calls

console.log("[config.azure.js] Azure configuration loaded (used during Azure build).");
console.log(`[config.azure.js] Build-time VITE_SERVER_IP (from import.meta.env): ${VITE_SERVER_IP_BUILD_TIME}`);
console.log(`[config.azure.js] Build-time VITE_SERVER_HTTP_PORT (from import.meta.env): ${VITE_SERVER_HTTP_PORT_BUILD_TIME}`);
console.log("[config.azure.js] Client-side SERVER_HTTP_URL is configured for RELATIVE API calls (e.g., '/api/endpoint'). Nginx will proxy these.");

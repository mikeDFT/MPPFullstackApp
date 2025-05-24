// Default development configuration (non-Azure)

// Vite provides environment variables through import.meta.env
// For local development, these might be undefined if not set in .env files or via CLI
// Fallback to localhost if not provided, suitable for local docker-compose or direct `npm run dev`

const VITE_SERVER_IP = (import.meta.env && import.meta.env.VITE_SERVER_IP) || "localhost";
const VITE_SERVER_HTTP_PORT = (import.meta.env && import.meta.env.VITE_SERVER_HTTP_PORT) || 8080;

export const SERVER_IP = VITE_SERVER_IP;
export const SERVER_HTTP_PORT = parseInt(VITE_SERVER_HTTP_PORT, 10);
export const CLIENT_PORT = 5173; // Default Vite dev port

export const SERVER_HTTP_URL = `http://${SERVER_IP}:${SERVER_HTTP_PORT}`;

console.log("[config.js] Default (local development) configuration loaded.");
console.log(`[config.js] SERVER_IP: ${SERVER_IP}`);
console.log(`[config.js] SERVER_HTTP_PORT: ${SERVER_HTTP_PORT}`);
console.log(`[config.js] Attempting to connect to backend at: ${SERVER_HTTP_URL}`);
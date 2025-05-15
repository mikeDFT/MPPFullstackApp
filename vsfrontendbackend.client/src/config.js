// Server configuration
export const SERVER_IP = 'localhost';

// Server ports
export const SERVER_HTTP_PORT = '7299';
export const SERVER_IIS_PORT = '33367';

// Client ports
export const CLIENT_PORT = '53392';

// Protocol configuration
export const HTTP_PROTOCOL = 'http';
export const HTTPS_PROTOCOL = 'https';
export const WS_PROTOCOL = 'ws';
export const WSS_PROTOCOL = 'wss';

// Constructed URLs
export const SERVER_HTTP_URL = `${HTTP_PROTOCOL}://${SERVER_IP}:${SERVER_HTTP_PORT}`;
export const SERVER_IIS_URL = `${HTTP_PROTOCOL}://${SERVER_IP}:${SERVER_IIS_PORT}`;
export const CLIENT_URL = `${HTTP_PROTOCOL}://${SERVER_IP}:${CLIENT_PORT}`;

// WebSocket URLs
export const WS_URL = `${WS_PROTOCOL}://${SERVER_IP}:${SERVER_HTTP_PORT}`;
export const WSS_URL = `${WSS_PROTOCOL}://${SERVER_IP}:${SERVER_HTTP_PORT}`; 
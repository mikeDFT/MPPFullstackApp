import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import path from 'path';
import { env } from 'process';

// Import configuration
import { SERVER_IP, SERVER_HTTP_PORT, CLIENT_PORT } from './src/config.js';

const target = env.ASPNETCORE_HTTPS_PORT ? `http://${SERVER_IP}:${CLIENT_PORT}/:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : `http://${SERVER_IP}:${CLIENT_PORT}/:${SERVER_HTTP_PORT}`;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [plugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true, // enables access over LAN
    port: parseInt(env.DEV_SERVER_PORT || CLIENT_PORT),
    proxy: {
      '^/weatherforecast': {
        target,
        secure: false
      }
    }
    // No HTTPS configuration for Docker builds
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})

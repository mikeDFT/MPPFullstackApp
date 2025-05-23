import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

// Import configuration
import { SERVER_IP, SERVER_HTTP_PORT, CLIENT_PORT } from './src/config.js';

// const baseFolder =
//     env.APPDATA !== undefined && env.APPDATA !== ''
//         ? `${env.APPDATA}/ASP.NET/https`
//         : `${env.HOME}/.aspnet/https`;

// const certificateName = "vsfrontendbackend.client";
// const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
// const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

// if (!fs.existsSync(baseFolder)) {
//     fs.mkdirSync(baseFolder, { recursive: true });
// }

// if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
//     if (0 !== child_process.spawnSync('dotnet', [
//         'dev-certs',
//         'https',
//         '--export-path',
//         certFilePath,
//         '--format',
//         'Pem',
//         '--no-password',
//     ], { stdio: 'inherit', }).status) {
//         throw new Error("Could not create certificate.");
//     }
// }

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
    //plugins: [react()],
    server: {
        host: true, // enables access over LAN
        port: parseInt(env.DEV_SERVER_PORT || CLIENT_PORT),  // or any port you like
        proxy: {
            '^/weatherforecast': {
                target,
                secure: false
            }
        },
        //https: {
        //    key: fs.readFileSync(keyFilePath),
        //    cert: fs.readFileSync(certFilePath),
        //}
    }
    //server: {
    //    proxy: {
    //        '^/weatherforecast': {
    //            target,
    //            secure: false
    //        }
    //    },
    //    port: parseInt(env.DEV_SERVER_PORT || '53392'),
    //    https: {
    //        key: fs.readFileSync(keyFilePath),
    //        cert: fs.readFileSync(certFilePath),
    //    }
    //}
})

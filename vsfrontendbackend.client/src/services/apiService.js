//import { env } from 'process';
import { getOnLineStatus } from '../utils/OnlineChecker';
import { SERVER_HTTP_URL } from '../config';
import { backendService } from './backendService';

// Get the API URL from environment variables or use default
// shamelessly stolen from vite.config.js
const env = import.meta.env;
const API_BASE_URL = env.ASPNETCORE_HTTPS_PORT ? `${SERVER_HTTP_URL}:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : SERVER_HTTP_URL;

// Track server status
let isServerUp = true;
let serverStatusListeners = new Set();

// Request queue system
const requestQueue = {
    queue: [],
    isProcessing: false,

    // Load queue from localStorage
    loadQueue: () => {
        try {
            const savedQueue = localStorage.getItem('requestQueue');
            if (savedQueue) {
                const parsedQueue = JSON.parse(savedQueue);
                // Recreate the execute functions for each queued request
                requestQueue.queue = parsedQueue.map(item => ({
                    ...item,
                    execute: () => {
                        const { method, url, body } = item;
                        // Map to corresponding backendService method instead of fetch
                        const serviceMethod = mapUrlToServiceMethod(method, url);
                        if (serviceMethod) {
                            return serviceMethod(body)
                                .then(response => handleBackendResponse(response));
                        }
                        return Promise.reject(new Error(`No service method found for ${method} ${url}`));
                    }
                }));
                console.log('Loaded queue from localStorage:', requestQueue.queue);
            }
        } catch (error) {
            console.error('Error loading queue from localStorage:', error);
        }
    },

    // Save queue to localStorage
    saveQueue: () => {
        try {
            // Only save the necessary data, not the functions
            const queueToSave = requestQueue.queue.map(item => ({
                method: item.method,
                url: item.url,
                body: item.body,
                timestamp: item.timestamp
            }));
            localStorage.setItem('requestQueue', JSON.stringify(queueToSave));
            console.log('Saved queue to localStorage:', queueToSave);
        } catch (error) {
            console.error('Error saving queue to localStorage:', error);
        }
    },

    add: (request) => {
        requestQueue.queue.push(request);
        requestQueue.saveQueue();
        console.log(`Request queued. Queue length: ${requestQueue.queue.length}`);
    },

    process: async () => {
        if (requestQueue.isProcessing || requestQueue.queue.length === 0) return;
        
        requestQueue.isProcessing = true;
        console.log(`Processing ${requestQueue.queue.length} queued requests...`);
        console.log(requestQueue.queue);

        while (requestQueue.queue.length > 0 && isServerUp && getOnLineStatus()) {
            const request = requestQueue.queue[0];
            try {
                await request.execute();
                requestQueue.queue.shift(); // Remove the processed request
                requestQueue.saveQueue(); // Save updated queue
                console.log(`Request processed successfully. ${requestQueue.queue.length} requests remaining.`);
            } catch (error) {
                console.error('Failed to process queued request:', error);
                break; // Stop processing if we encounter an error
            }
        }

        requestQueue.isProcessing = false;
    }
};

// Map URL to corresponding backendService method
const mapUrlToServiceMethod = (method, url) => {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const id = path.split('/').pop();
    
    // Game endpoints
    if (path.startsWith(`${API_BASE_URL}/game`)) {
        if (method === 'GET') {
            if (path === `${API_BASE_URL}/game`) {
                return params => backendService.getAllGames(params);
            } else {
                return () => backendService.getGameById(parseInt(id));
            }
        } else if (method === 'POST') {
            return body => backendService.modifyGame(body);
        } else if (method === 'DELETE') {
            return () => backendService.deleteGame(parseInt(id));
        }
    }
    
    // Company endpoints
    if (path.startsWith(`${API_BASE_URL}/company`)) {
        if (method === 'GET') {
            if (path === `${API_BASE_URL}/company`) {
                return params => backendService.getAllCompanies(params);
            } else {
                return () => backendService.getCompanyById(parseInt(id));
            }
        } else if (method === 'POST') {
            return body => backendService.modifyCompany(body);
        } else if (method === 'DELETE') {
            return () => backendService.deleteCompany(parseInt(id));
        }
    }
    
    // Files endpoints
    if (path.startsWith(`${API_BASE_URL}/files`)) {
        if (path.includes('upload')) {
            return file => backendService.uploadFile(file);
        } else if (path.includes('download')) {
            return () => backendService.downloadFile();
        } else if (path.includes('exists')) {
            return () => backendService.fileExists();
        }
    }
    
    // Rating chart endpoint
    if (path.startsWith(`${API_BASE_URL}/ratingchart`)) {
        return () => backendService.getRatingDistribution();
    }
    
    return null;
};

// Load queue on startup
requestQueue.loadQueue();

// Helper function to check if we can make requests
const canMakeRequest = () => {
    return isServerUp && getOnLineStatus();
};

// Process backend service responses
async function handleBackendResponse(response) {
    if (!response.ok) {
        isServerUp = true;
        serverStatusListeners.forEach(listener => listener(false));
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = response.data;
    console.log('Response:', data);
    isServerUp = true;
    serverStatusListeners.forEach(listener => listener(true));
    return data;
}

export const serverStatus = {
    isUp: () => isServerUp,
    subscribe: (listener) => {
        serverStatusListeners.add(listener);
        return () => serverStatusListeners.delete(listener);
    }
};

// Add server status check function
export const checkServerStatus = async () => {
    if (!getOnLineStatus()) {
        console.log('Network is down, skipping server status check');
        return false;
    }

    try {
        const response = await backendService.checkStatus();
        await handleBackendResponse(response);
        // If we get here, the server is up, so process any queued requests
        requestQueue.process();
        return true;
    } catch (error) {
        console.warn('Server status check failed:', error);
        isServerUp = true;
        serverStatusListeners.forEach(listener => listener(false));
        return false;
    }
};

// Helper function to create a queued request
const createQueuedRequest = (method, url, body = null) => ({
    method,
    url,
    body,
    timestamp: Date.now(),
    execute: () => {
        const serviceMethod = mapUrlToServiceMethod(method, url);
        if (serviceMethod) {
            return serviceMethod(body).then(handleBackendResponse);
        }
        return Promise.reject(new Error(`No service method found for ${method} ${url}`));
    }
});

// Set up network status change listener
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('Network is back online, checking server status...');
        checkServerStatus();
    });
}

export const apiService = {
    // polling interval in milliseconds (4 seconds) - I will update the game list every 4 seconds
    POLLING_INTERVAL: 10000,
    INITIAL_REFRESH_TIME: 300,

    // Fetch all games
    getAllGames: async (params) => {
        const executeRequest = async () => {
            const response = await backendService.getAllGames(params);
            const games = await handleBackendResponse(response);
            return games.map(game => ({
                Id: game.Id,
                Name: game.Name,
                Price: game.Price,
                Description: game.Description,
                IconID: game.IconID,
                Rating: game.Rating,
                Genres: game.Genres,
                Platforms: game.Platforms,
                CompanyID: game.CompanyID,
                CompanyName: game.CompanyName
            }));
        };

        try {
            if (!canMakeRequest()) {
                // Return data from localStorage when offline
                const savedGames = localStorage.getItem('gamesInfo');
                return savedGames ? JSON.parse(savedGames) : [];
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to fetch games:', error);
            // Return data from localStorage on error
            const savedGames = localStorage.getItem('gamesInfo');
            return savedGames ? JSON.parse(savedGames) : [];
        }
    },

    // Fetch a single game
    getGame: async (id) => {
        const executeRequest = async () => {
            const response = await backendService.getGameById(id);
            const game = await handleBackendResponse(response);
            return {
                Id: game.Id,
                Name: game.Name,
                Price: game.Price,
                Description: game.Description,
                IconID: game.IconID,
                Rating: game.Rating,
                Genres: game.Genres,
                Platforms: game.Platforms,
                CompanyID: game.CompanyID,
                CompanyName: game.CompanyName
            };
        };

        try {
            if (!canMakeRequest()) {
                // Return data from localStorage when offline
                const savedGames = localStorage.getItem('gamesInfo');
                if (savedGames) {
                    const games = JSON.parse(savedGames);
                    const game = games.find(g => g.Id === id);
                    if (game) return game;
                }
                throw new Error('Game not found in localStorage');
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to fetch game:', error);
            throw error;
        }
    },
    
    // Add new game or update an already existing one
    modifyGame: async (game) => {
        const executeRequest = async () => {
            const response = await backendService.modifyGame(game);
            return await handleBackendResponse(response);
        };

        try {
            if (!canMakeRequest()) {
                requestQueue.add(createQueuedRequest('POST', `${API_BASE_URL}/game`, game));
                throw new Error(getOnLineStatus() ? 'Server is down. Request queued.' : 'Network is down. Request queued.');
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to modify game:', error);
            throw error;
        }
    },

    // Delete game
    deleteGame: async (id) => {
        const executeRequest = async () => {
            const response = await backendService.deleteGame(id);
            return await handleBackendResponse(response);
        };

        try {
            if (!canMakeRequest()) {
                requestQueue.add(createQueuedRequest('DELETE', `${API_BASE_URL}/game/${id}`));
                throw new Error(getOnLineStatus() ? 'Server is down. Request queued.' : 'Network is down. Request queued.');
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to delete game:', error);
            throw error;
        }
    },

    // Fetch all companies
    getAllCompanies: async (params) => {
        const executeRequest = async () => {
            const response = await backendService.getAllCompanies(params);
            return await handleBackendResponse(response);
        };

        try {
            if (!canMakeRequest()) {
                // Return data from localStorage when offline
                const savedCompanies = localStorage.getItem('companiesInfo');
                return savedCompanies ? JSON.parse(savedCompanies) : [];
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to fetch companies:', error);
            // Return data from localStorage on error
            const savedCompanies = localStorage.getItem('companiesInfo');
            return savedCompanies ? JSON.parse(savedCompanies) : [];
        }
    },

    // Fetch a single company
    getCompany: async (id) => {
        const executeRequest = async () => {
            const response = await backendService.getCompanyById(id);
            return await handleBackendResponse(response);
        };

        try {
            if (!canMakeRequest()) {
                // Return data from localStorage when offline
                const savedCompanies = localStorage.getItem('companiesInfo');
                if (savedCompanies) {
                    const companies = JSON.parse(savedCompanies);
                    const company = companies.find(c => c.Id === id);
                    if (company) return company;
                }
                throw new Error('Company not found in localStorage');
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to fetch company:', error);
            throw error;
        }
    },
    
    // Add new company or update an already existing one
    modifyCompany: async (company) => {
        const executeRequest = async () => {
            const response = await backendService.modifyCompany(company);
            return await handleBackendResponse(response);
        };

        try {
            if (!canMakeRequest()) {
                requestQueue.add(createQueuedRequest('POST', `${API_BASE_URL}/company`, company));
                throw new Error(getOnLineStatus() ? 'Server is down. Request queued.' : 'Network is down. Request queued.');
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to modify company:', error);
            throw error;
        }
    },

    // Delete company
    deleteCompany: async (id) => {
        const executeRequest = async () => {
            const response = await backendService.deleteCompany(id);
            return await handleBackendResponse(response);
        };

        try {
            if (!canMakeRequest()) {
                requestQueue.add(createQueuedRequest('DELETE', `${API_BASE_URL}/company/${id}`));
                throw new Error(getOnLineStatus() ? 'Server is down. Request queued.' : 'Network is down. Request queued.');
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to delete company:', error);
            throw error;
        }
    },

    // File upload and download methods
    uploadFile: async (file) => {
        try {
            const response = await backendService.uploadFile(file);
            
            if (!response.ok) {
                const errorText = response.data?.error || 'Unknown error';
                throw new Error(`Upload failed: ${errorText}`);
            }
            
            return response.data;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    },

    downloadFile: async () => {
        try {
            const response = await backendService.downloadFile();

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('No file found on server');
                }
                const errorText = response.data?.error || 'Unknown error';
                throw new Error(`Download failed: ${errorText}`);
            }

            const { blob, filename, contentType } = response.data;
            return { blob, filename, contentType };
        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        }
    },

    checkFileExists: async () => {
        try {
            const response = await backendService.fileExists();
            
            if (!response.ok) {
                throw new Error('Failed to check if file exists');
            }
            
            return response.data.exists;
        } catch (error) {
            console.error('Error checking if file exists:', error);
            return false;
        }
    },

    // Get rating distribution data
    getRatingDistribution: async () => {
        const executeRequest = async () => {
            const response = await backendService.getRatingDistribution();
            return await handleBackendResponse(response);
        };

        try {
            if (!canMakeRequest()) {
                // Return data from localStorage when offline
                const savedRatingData = localStorage.getItem('ratingDistribution');
                return savedRatingData ? JSON.parse(savedRatingData) : {
                    "1-2": 0,
                    "2-3": 0,
                    "3-4": 0,
                    "4-5": 0
                };
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to fetch rating distribution:', error);
            // Return data from localStorage on error
            const savedRatingData = localStorage.getItem('ratingDistribution');
            return savedRatingData ? JSON.parse(savedRatingData) : {
                "1-2": 0,
                "2-3": 0,
                "3-4": 0,
                "4-5": 0
            };
        }
    }
};

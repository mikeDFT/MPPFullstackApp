//import { env } from 'process';
import { getOnLineStatus } from '../utils/OnlineChecker';
import { SERVER_HTTP_URL } from '../config';
import simulationConfig from '../config/simulationConfig';
import localBackend from './simulatedBackend';

// Get the API URL from environment variables or use default
// shamelessly stolen from vite.config.js
const env = import.meta.env;
const API_BASE_URL = env.ASPNETCORE_HTTPS_PORT ? `${SERVER_HTTP_URL}:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : SERVER_HTTP_URL;

// Initialize local backend
const localBackendInstance = localBackend;

// Track server status
let isServerUp = true;
let serverStatusListeners = new Set();

// function resetLocalStorageQueue() {
//    localStorage.setItem('requestQueue', [])
// }
// resetLocalStorageQueue();

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
                        return fetch(url, {
                            method,
                            headers: body ? { 'Content-Type': 'application/json' } : undefined,
                            body: body ? JSON.stringify(body) : undefined
                        }).then(handleResponse);
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

// Load queue on startup
requestQueue.loadQueue();

// Helper function to check if we can make requests
const canMakeRequest = () => {
    return isServerUp && getOnLineStatus();
};

// Helper function to determine if we should use simulated backend
const shouldUseSimulation = () => {
    return simulationConfig.isSimulationMode() || !canMakeRequest();
};

async function handleResponse(response) {
    if (!response.ok) {
        isServerUp = false;
        serverStatusListeners.forEach(listener => listener(false));
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Check if the response has content before parsing JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json") && response.status !== 204) {
        var json = await response.json();
        console.log('Response:', json);
        isServerUp = true;
        serverStatusListeners.forEach(listener => listener(true));
        return json;
    } else {
        // Return a simple success object for empty responses
        console.log("Empty response");
        isServerUp = true;
        serverStatusListeners.forEach(listener => listener(true));
        return { success: true, status: response.status };
    }
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
        const response = await fetch(`${API_BASE_URL}/game`);
        await handleResponse(response);
        // If we get here, the server is up, so process any queued requests
        requestQueue.process();
        return true;
    } catch (error) {
        console.warn('Server status check failed:', error);
        isServerUp = false;
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
        return fetch(url, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
        }).then(handleResponse);
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
    INITIAL_REFRESH_TIME: 300,    // Fetch all games
    getAllGames: async (params) => {        // Use simulated backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for getAllGames');
            return await localBackendInstance.games.getAll(params);
        }

        const executeRequest = async () => {
            const queryParams = new URLSearchParams();
            
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.ascending !== undefined) queryParams.append('Ascending', params.ascending);
            if (params.searchText) queryParams.append('SearchText', params.searchText);
            console.log("Company search text:", params.companySearchText);
            if (params.companySearchText) queryParams.append('CompanySearchText', params.companySearchText);
            if (params.genres) {
                for (var genre of params.genres) {
                    queryParams.append('Genres', genre);
                }
            }   
            if (params.platforms) {
                for (var platform of params.platforms) {
                    queryParams.append('Platforms', platform);
                }
            }

            const queryString = queryParams.toString();
            const response = await fetch(`${API_BASE_URL}/game?${queryString}`);
            var games = await handleResponse(response);
            return games.map(game => ({
                Id: game.id,
                Name: game.name,
                Price: game.price,
                Description: game.description,
                IconID: game.iconID,
                Rating: game.rating,
                Genres: game.genres,
                Platforms: game.platforms,
                CompanyID: game.companyID,
                CompanyName: game.companyName
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
            console.error('Failed to fetch games:', error);            // Fallback to simulated backend on error
            console.log('Falling back to local backend due to error');
            return await localBackendInstance.games.getAll(params);
        }
    },    // Fetch a single game
    getGame: async (id) => {        // Use simulated backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for getGame');
            return await localBackendInstance.games.getById(id);
        }

        const executeRequest = async () => {
            const response = await fetch(`${API_BASE_URL}/game/${id}`);
            var game = await handleResponse(response);
            return {
                Id: game.id,
                Name: game.name,
                Price: game.price,
                Description: game.description,
                IconID: game.iconID,
                Rating: game.rating,
                Genres: game.genres,
                Platforms: game.platforms,
                CompanyID: game.companyID,
                CompanyName: game.companyName
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
            console.error('Failed to fetch game:', error);            // Fallback to simulated backend on error
            console.log('Falling back to local backend due to error');
            return await localBackendInstance.games.getById(id);
        }
    },
      // Add new game or update an already existing one
    modifyGame: async (game) => {        // Use simulated backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for modifyGame');
            return await localBackendInstance.games.modify(game);
        }

        const executeRequest = async () => {
            const response = await fetch(`${API_BASE_URL}/game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(game)
            });
            return await handleResponse(response);
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
    },    // Delete game
    deleteGame: async (id) => {        // Use simulated backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for deleteGame');
            return await localBackendInstance.games.delete(id);
        }

        const executeRequest = async () => {
            const response = await fetch(`${API_BASE_URL}/game/${id}`, {
                method: 'DELETE'
            });
            return await handleResponse(response);
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
    },    // Fetch all companies
    getAllCompanies: async (params) => {        // Use local backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for getAllCompanies');
            return await localBackend.companies.getAll(params);
        }

        const executeRequest = async () => {
            const queryParams = new URLSearchParams();
            
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.ascending !== undefined) queryParams.append('Ascending', params.ascending);
            if (params.searchText) queryParams.append('SearchText', params.searchText);

            const queryString = queryParams.toString();
            const response = await fetch(`${API_BASE_URL}/company?${queryString}`);
            return await handleResponse(response);
        };

        try {
            if (!canMakeRequest()) {
                // Return data from localStorage when offline
                const savedCompanies = localStorage.getItem('companiesInfo');
                return savedCompanies ? JSON.parse(savedCompanies) : [];
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to fetch companies:', error);            // Fallback to local backend on error
            console.log('Falling back to local backend due to error');
            return await localBackend.companies.getAll(params);
        }
    },    // Fetch a single company
    getCompany: async (id) => {        // Use local backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for getCompany');
            return await localBackend.companies.getById(id);
        }

        const executeRequest = async () => {
            const response = await fetch(`${API_BASE_URL}/company/${id}`);
            return await handleResponse(response);
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
            console.error('Failed to fetch company:', error);            // Fallback to local backend on error
            console.log('Falling back to local backend due to error');
            return await localBackend.companies.getById(id);
        }
    },
      // Add new company or update an already existing one
    modifyCompany: async (company) => {        // Use local backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for modifyCompany');
            return await localBackend.companies.modify(company);
        }

        const executeRequest = async () => {
            const response = await fetch(`${API_BASE_URL}/company`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(company)
            });
            return await handleResponse(response);
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
    },    // Delete company
    deleteCompany: async (id) => {        // Use local backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for deleteCompany');
            return await localBackend.companies.delete(id);
        }

        const executeRequest = async () => {
            const response = await fetch(`${API_BASE_URL}/company/${id}`, {
                method: 'DELETE'
            });
            return await handleResponse(response);
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
    },    // File upload and download methods
    uploadFile: async (file) => {        // Use local backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for uploadFile');
            return await localBackend.files.upload(file);
        }

        const formData = new FormData();
        // formData.append('file', file);
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/files/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${errorText}`);
            }
            
            var json = await response.json();
            console.log(json);

            return await json;
        } catch (error) {
            console.error('Error uploading file:', error);            // Fallback to local backend on error
            console.log('Falling back to local backend due to error');
            return await localBackend.files.upload(file);
        }
    },    downloadFile: async () => {        // Use local backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for downloadFile');
            return await localBackend.files.download();
        }

        try {
            const response = await fetch(`${API_BASE_URL}/files/download`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('No file found on server');
                }
                const errorText = await response.text();
                throw new Error(`Download failed: ${errorText}`);
            }

            // Get the filename from the Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            console.log(response)
            console.log(contentDisposition)
            let filename = 'downloaded_file';
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                    console.log('Filename from server:', filename);
                }
            }

            // Get content type from response headers
            const contentType = response.headers.get('Content-Type');
            console.log('Content-Type from server:', contentType);

            // Create a blob from the response with the correct content type
            const blob = await response.blob();
            
            return { blob, filename, contentType };
        } catch (error) {
            console.error('Error downloading file:', error);            // Fallback to local backend on error
            console.log('Falling back to local backend due to error');
            return await localBackend.files.download();
        }
    },    checkFileExists: async () => {        // Use local backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for checkFileExists');
            return await localBackend.files.exists();
        }

        try {
            const response = await fetch(`${API_BASE_URL}/files/exists`);
            
            if (!response.ok) {
                throw new Error('Failed to check if file exists');
            }
            
            const data = await response.json();
            return data.exists;
        } catch (error) {
            console.error('Error checking if file exists:', error);            // Fallback to local backend on error
            console.log('Falling back to local backend due to error');
            return await localBackend.files.exists();
        }
    },    // Get rating distribution data
    getRatingDistribution: async () => {        // Use local backend if in simulation mode or server is unavailable
        if (shouldUseSimulation()) {
            console.log('Using local backend for getRatingDistribution');
            return await localBackend.ratingChart.getRatingDistribution();
        }

        const executeRequest = async () => {
            const response = await fetch(`${API_BASE_URL}/ratingchart`);
            return await handleResponse(response);
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
            console.error('Failed to fetch rating distribution:', error);            // Fallback to local backend on error
            console.log('Falling back to local backend due to error');
            return await localBackend.ratingChart.getRatingDistribution();        }
    }
};

// Export simulation configuration for external use
export { simulationConfig };
export const enableSimulationMode = () => simulationConfig.enableSimulation();
export const disableSimulationMode = () => simulationConfig.disableSimulation();
export const toggleSimulationMode = () => simulationConfig.toggle();
export const isSimulationModeActive = () => simulationConfig.isSimulationMode();

//import { env } from 'process';
import { getOnLineStatus } from '../utils/OnlineChecker';
import { SERVER_HTTP_URL } from '../config';

// Get the API URL from environment variables or use default
// shamelessly stolen from vite.config.js
const env = import.meta.env;
const API_BASE_URL = env.ASPNETCORE_HTTPS_PORT ? `${SERVER_HTTP_URL}:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : SERVER_HTTP_URL;

console.log(API_BASE_URL);

// Track server status
let isServerUp = true;
let serverStatusListeners = new Set();

//function resetLocalStorageQueue() {
//    localStorage.setItem('requestQueue', [])
//}
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
    POLLING_INTERVAL: 4000,
    INITIAL_REFRESH_TIME: 300,

    // Fetch all games
    getAllGames: async (params) => {
        const executeRequest = async () => {
            const queryParams = new URLSearchParams();
            
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.ascending !== undefined) queryParams.append('Ascending', params.ascending);
            if (params.searchText) queryParams.append('SearchText', params.searchText);
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
            return await handleResponse(response);
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
            const response = await fetch(`${API_BASE_URL}/game/${id}`);
            return await handleResponse(response);
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
    },

    // Delete game
    deleteGame: async (id) => {
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
    },

    // File upload and download methods
    uploadFile: async (file) => {
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
            console.error('Error uploading file:', error);
            throw error;
        }
    },

    downloadFile: async () => {
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
            console.error('Error downloading file:', error);
            throw error;
        }
    },

    checkFileExists: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/files/exists`);
            
            if (!response.ok) {
                throw new Error('Failed to check if file exists');
            }
            
            const data = await response.json();
            return data.exists;
        } catch (error) {
            console.error('Error checking if file exists:', error);
            return false;
        }
    }
};

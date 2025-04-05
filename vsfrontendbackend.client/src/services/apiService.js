//import { env } from 'process';
import { useNavigatorOnLine } from '../utils/OnlineChecker';

// Get the API URL from environment variables or use default
// shamelessly stolen from vite.config.js
const env = import.meta.env;
const API_BASE_URL = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7299';

// Track server status
let isServerUp = true;
let serverStatusListeners = new Set();

// Request queue system
const requestQueue = {
    queue: [],
    isProcessing: false,
    add: (request) => {
        requestQueue.queue.push(request);
        console.log(`Request queued. Queue length: ${requestQueue.queue.length}`);
    },
    process: async () => {
        if (requestQueue.isProcessing || requestQueue.queue.length === 0) return;
        
        requestQueue.isProcessing = true;
        console.log(`Processing ${requestQueue.queue.length} queued requests...`);

        while (requestQueue.queue.length > 0 && isServerUp && getOnLineStatus()) {
            const request = requestQueue.queue[0];
            try {
                await request.execute();
                requestQueue.queue.shift(); // Remove the processed request
                console.log(`Request processed successfully. ${requestQueue.queue.length} requests remaining.`);
            } catch (error) {
                console.error('Failed to process queued request:', error);
                break; // Stop processing if we encounter an error
            }
        }

        requestQueue.isProcessing = false;
    }
};

export const serverStatus = {
    isUp: () => isServerUp,
    subscribe: (listener) => {
        serverStatusListeners.add(listener);
        return () => serverStatusListeners.delete(listener);
    }
};

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
        console.error('Server status check failed:', error);
        isServerUp = false;
        serverStatusListeners.forEach(listener => listener(false));
        return false;
    }
};

// Helper function to create a queued request
const createQueuedRequest = (execute) => ({
    execute,
    timestamp: Date.now()
});

// Set up network status change listener
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('Network is back online, checking server status...');
        checkServerStatus();
    });
}

export const apiService = {
    // polling interval in milliseconds (10 seconds) - I will update the game list every 10 seconds
    POLLING_INTERVAL: 1000,
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
                requestQueue.add(createQueuedRequest(executeRequest));
                throw new Error(getOnLineStatus() ? 'Server is down. Request queued.' : 'Network is down. Request queued.');
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to fetch games:', error);
            throw error;
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
                requestQueue.add(createQueuedRequest(executeRequest));
                throw new Error(getOnLineStatus() ? 'Server is down. Request queued.' : 'Network is down. Request queued.');
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
                requestQueue.add(createQueuedRequest(executeRequest));
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
                requestQueue.add(createQueuedRequest(executeRequest));
                throw new Error(getOnLineStatus() ? 'Server is down. Request queued.' : 'Network is down. Request queued.');
            }
            return await executeRequest();
        } catch (error) {
            console.error('Failed to delete game:', error);
            throw error;
        }
    }
};

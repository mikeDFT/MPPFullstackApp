//import { env } from 'process';

// Get the API URL from environment variables or use default
// shamelessly stolen from vite.config.js
const env = import.meta.env;
const API_BASE_URL = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7299';


async function handleResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Check if the response has content before parsing JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json") && response.status !== 204) {
        var json = await response.json();
        console.log('Response:', json);
        return json;
    } else {
        // Return a simple success object for empty responses
        console.log("Empty response");
        return { success: true, status: response.status };
    }
}

export const apiService = {
    // polling interval in milliseconds (10 seconds) - I will update the game list every 10 seconds
    POLLING_INTERVAL: 1000,
    INITIAL_REFRESH_TIME: 300,

    // Fetch all games
    getAllGames: async (params) => {
        try {
            // Construct query params from the passed params object
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
            console.log(queryString);
            const response = await fetch(`${API_BASE_URL}/game?${queryString}`);
            console.log(response);
            console.log(response.status);

            return await handleResponse(response);
        } catch (error) {
            // Handle errors (e.g., log them or show a notification)
            console.error('Failed to fetch games:', error);
            throw error; // Rethrow the error if you want to handle it further up the call stack
        }
    },

    // Fetch a single game
    getGame: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/game/${id}`);

            return await handleResponse(response);
        } catch (error) {
            console.error('Failed to fetch game:', error);
            throw error;
        }
    },
    
    // Add new game or update an already existing one
    modifyGame: async (game) => {
        try {
            const response = await fetch(`${API_BASE_URL}/game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(game)
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Failed to modify game:', error);
            throw error;
        }
    },

    // Delete game
    deleteGame: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/game/${id}`, {
                method: 'DELETE'
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Failed to delete game:', error);
            throw error;
        }
    }
};

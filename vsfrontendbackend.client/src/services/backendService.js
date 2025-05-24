import { SERVER_HTTP_URL } from '../config';

// Get the API URL from environment variables or use default
const env = import.meta.env;
const API_BASE_URL = env.ASPNETCORE_HTTPS_PORT ? `${SERVER_HTTP_URL}:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : SERVER_HTTP_URL;

// Simulate network delay
const simulateNetworkDelay = () => {
    const minDelay = 50;
    const maxDelay = 200;
    return new Promise(resolve => setTimeout(resolve, Math.random() * (maxDelay - minDelay) + minDelay));
};

// Simulate server response with proper status and headers
const createResponse = (data, status = 200) => {
    return {
        data,
        status,
        ok: status >= 200 && status < 300,
        headers: {
            get: (headerName) => {
                if (headerName === 'content-type') return 'application/json';
                if (headerName === 'Content-Disposition' && data?.filename) 
                    return `attachment; filename="${data.filename}"`;
                return null;
            }
        }
    };
};

// In-memory data store for simulation
let dataStore = {
    games: [],
    companies: [],
    currentFile: null,
    ratingDistribution: {
        "1-2": 2,
        "2-3": 5,
        "3-4": 10,
        "4-5": 8
    }
};

// Initialize with some default data if empty
const initializeDataStore = () => {
    // Check if we have stored data in localStorage
    const savedGames = localStorage.getItem('gamesInfo');
    const savedCompanies = localStorage.getItem('companiesInfo');
    
    if (savedGames) {
        dataStore.games = JSON.parse(savedGames);
    } else if (dataStore.games.length === 0) {
        dataStore.games = [
            {
                Id: 1,
                Name: "Epic Adventure Quest",
                Price: 29.99,
                Description: "Embark on an epic adventure through mystical lands filled with challenges, treasures, and legendary creatures.",
                IconID: "adventure_icon",
                Rating: 4.5,
                Genres: ["Adventure", "RPG", "Action"],
                Platforms: ["PC", "Xbox", "PlayStation"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 2,
                Name: "Space Commander",
                Price: 39.99,
                Description: "Command your own spaceship and explore the galaxy in this thrilling space simulation game.",
                IconID: "space_icon",
                Rating: 4.2,
                Genres: ["Strategy", "Simulation", "Sci-Fi"],
                Platforms: ["PC", "Nintendo Switch", "Mobile"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            }
        ];
        localStorage.setItem('gamesInfo', JSON.stringify(dataStore.games));
    }
    
    if (savedCompanies) {
        dataStore.companies = JSON.parse(savedCompanies);
    } else if (dataStore.companies.length === 0) {
        dataStore.companies = [
            {
                Id: 1,
                CompanyName: "Adventure Studios",
                Description: "Creating epic adventure games since 2005",
                Founded: "2005-03-15",
                Website: "https://adventurestudios.example.com"
            },
            {
                Id: 2,
                CompanyName: "Cosmic Games",
                Description: "Specializing in space and sci-fi gaming experiences",
                Founded: "2010-07-22",
                Website: "https://cosmicgames.example.com"
            }
        ];
        localStorage.setItem('companiesInfo', JSON.stringify(dataStore.companies));
    }
    
    // Save rating distribution
    localStorage.setItem('ratingDistribution', JSON.stringify(dataStore.ratingDistribution));
};

// Call initialization
initializeDataStore();

// Utility functions
const filterGames = (games, params) => {
    let filtered = [...games];
    
    if (params.searchText) {
        const searchText = params.searchText.toLowerCase();
        filtered = filtered.filter(g => g.Name.toLowerCase().includes(searchText));
    }
    
    if (params.companySearchText) {
        const companySearchText = params.companySearchText.toLowerCase();
        filtered = filtered.filter(g => g.CompanyName.toLowerCase().includes(companySearchText));
    }
    
    if (params.genres && params.genres.length > 0) {
        filtered = filtered.filter(g => 
            g.Genres.some(genre => params.genres.includes(genre))
        );
    }
    
    if (params.platforms && params.platforms.length > 0) {
        filtered = filtered.filter(g => 
            g.Platforms.some(platform => params.platforms.includes(platform))
        );
    }
    
    if (params.sortBy) {
        filtered.sort((a, b) => {
            const aValue = a[params.sortBy];
            const bValue = b[params.sortBy];
            
            if (typeof aValue === 'string') {
                return params.ascending ? 
                    aValue.localeCompare(bValue) : 
                    bValue.localeCompare(aValue);
            } else {
                return params.ascending ? 
                    aValue - bValue : 
                    bValue - aValue;
            }
        });
    }
    
    return filtered;
};

const filterCompanies = (companies, params) => {
    let filtered = [...companies];
    
    if (params.searchText) {
        const searchText = params.searchText.toLowerCase();
        filtered = filtered.filter(c => c.CompanyName.toLowerCase().includes(searchText));
    }
    
    if (params.sortBy) {
        filtered.sort((a, b) => {
            const aValue = a[params.sortBy];
            const bValue = b[params.sortBy];
            
            if (typeof aValue === 'string') {
                return params.ascending ? 
                    aValue.localeCompare(bValue) : 
                    bValue.localeCompare(aValue);
            } else {
                return params.ascending ? 
                    aValue - bValue : 
                    bValue - aValue;
            }
        });
    }
    
    return filtered;
};

// Backend service implementation
export const backendService = {
    // Game controller methods
    getAllGames: async (params = {}) => {
        await simulateNetworkDelay();
        try {
            const games = filterGames(dataStore.games, params);
            return createResponse(games);
        } catch (error) {
            console.error('Backend service error - getAllGames:', error);
            return createResponse({ error: 'Failed to get games' }, 500);
        }
    },
    
    getGameById: async (id) => {
        await simulateNetworkDelay();
        try {
            const game = dataStore.games.find(g => g.Id === id);
            if (game) {
                return createResponse(game);
            } else {
                return createResponse({ error: 'Game not found' }, 404);
            }
        } catch (error) {
            console.error(`Backend service error - getGameById(${id}):`, error);
            return createResponse({ error: 'Failed to get game' }, 500);
        }
    },
    
    modifyGame: async (game) => {
        await simulateNetworkDelay();
        try {
            if (game.Id) {
                // Update existing game
                const index = dataStore.games.findIndex(g => g.Id === game.Id);
                if (index !== -1) {
                    dataStore.games[index] = { ...game };
                } else {
                    return createResponse({ error: 'Game not found' }, 404);
                }
            } else {
                // Create new game
                const newId = Math.max(0, ...dataStore.games.map(g => g.Id)) + 1;
                const newGame = { ...game, Id: newId };
                dataStore.games.push(newGame);
                game = newGame;
            }
            
            // Update localStorage
            localStorage.setItem('gamesInfo', JSON.stringify(dataStore.games));
            return createResponse(game);
        } catch (error) {
            console.error('Backend service error - modifyGame:', error);
            return createResponse({ error: 'Failed to modify game' }, 500);
        }
    },
    
    deleteGame: async (id) => {
        await simulateNetworkDelay();
        try {
            const index = dataStore.games.findIndex(g => g.Id === id);
            if (index !== -1) {
                dataStore.games.splice(index, 1);
                localStorage.setItem('gamesInfo', JSON.stringify(dataStore.games));
                return createResponse({ id });
            } else {
                return createResponse({ error: 'Game not found' }, 404);
            }
        } catch (error) {
            console.error(`Backend service error - deleteGame(${id}):`, error);
            return createResponse({ error: 'Failed to delete game' }, 500);
        }
    },
    
    // Company controller methods
    getAllCompanies: async (params = {}) => {
        await simulateNetworkDelay();
        try {
            const companies = filterCompanies(dataStore.companies, params);
            return createResponse(companies);
        } catch (error) {
            console.error('Backend service error - getAllCompanies:', error);
            return createResponse({ error: 'Failed to get companies' }, 500);
        }
    },
    
    getCompanyById: async (id) => {
        await simulateNetworkDelay();
        try {
            const company = dataStore.companies.find(c => c.Id === id);
            if (company) {
                return createResponse(company);
            } else {
                return createResponse({ error: 'Company not found' }, 404);
            }
        } catch (error) {
            console.error(`Backend service error - getCompanyById(${id}):`, error);
            return createResponse({ error: 'Failed to get company' }, 500);
        }
    },
    
    modifyCompany: async (company) => {
        await simulateNetworkDelay();
        try {
            if (company.Id) {
                // Update existing company
                const index = dataStore.companies.findIndex(c => c.Id === company.Id);
                if (index !== -1) {
                    dataStore.companies[index] = { ...company };
                } else {
                    return createResponse({ error: 'Company not found' }, 404);
                }
            } else {
                // Create new company
                const newId = Math.max(0, ...dataStore.companies.map(c => c.Id)) + 1;
                const newCompany = { ...company, Id: newId };
                dataStore.companies.push(newCompany);
                company = newCompany;
            }
            
            // Update localStorage
            localStorage.setItem('companiesInfo', JSON.stringify(dataStore.companies));
            return createResponse(company);
        } catch (error) {
            console.error('Backend service error - modifyCompany:', error);
            return createResponse({ error: 'Failed to modify company' }, 500);
        }
    },
    
    deleteCompany: async (id) => {
        await simulateNetworkDelay();
        try {
            const index = dataStore.companies.findIndex(c => c.Id === id);
            if (index !== -1) {
                dataStore.companies.splice(index, 1);
                localStorage.setItem('companiesInfo', JSON.stringify(dataStore.companies));
                return createResponse({ id });
            } else {
                return createResponse({ error: 'Company not found' }, 404);
            }
        } catch (error) {
            console.error(`Backend service error - deleteCompany(${id}):`, error);
            return createResponse({ error: 'Failed to delete company' }, 500);
        }
    },
    
    // File controller methods
    uploadFile: async (file) => {
        await simulateNetworkDelay();
        try {
            dataStore.currentFile = {
                content: file,
                filename: file.name,
                contentType: file.type,
                size: file.size,
                lastModified: new Date()
            };
            return createResponse({ fileName: file.name });
        } catch (error) {
            console.error('Backend service error - uploadFile:', error);
            return createResponse({ error: 'Failed to upload file' }, 500);
        }
    },
    
    downloadFile: async () => {
        await simulateNetworkDelay();
        try {
            if (!dataStore.currentFile) {
                return createResponse({ error: 'No file found' }, 404);
            }
            
            const { content, filename, contentType } = dataStore.currentFile;
            return createResponse({ 
                blob: content, 
                filename, 
                contentType 
            });
        } catch (error) {
            console.error('Backend service error - downloadFile:', error);
            return createResponse({ error: 'Failed to download file' }, 500);
        }
    },
    
    fileExists: async () => {
        await simulateNetworkDelay();
        try {
            return createResponse({ exists: !!dataStore.currentFile });
        } catch (error) {
            console.error('Backend service error - fileExists:', error);
            return createResponse({ error: 'Failed to check if file exists' }, 500);
        }
    },
    
    // Rating chart controller methods
    getRatingDistribution: async () => {
        await simulateNetworkDelay();
        try {
            return createResponse(dataStore.ratingDistribution);
        } catch (error) {
            console.error('Backend service error - getRatingDistribution:', error);
            return createResponse({ error: 'Failed to get rating distribution' }, 500);
        }
    },
    
    // Server status check
    checkStatus: async () => {
        await simulateNetworkDelay();
        return createResponse({ status: 'ok' });
    }
};

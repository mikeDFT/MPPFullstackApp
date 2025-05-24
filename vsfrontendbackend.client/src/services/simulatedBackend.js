// Local Backend Service
// This file provides local backend functionality without actual network calls

// Local data storage (replaces database)
let localData = {
    games: [],
    companies: [],
    logs: [],
    ratingDistribution: {
        "1-2": 0,
        "2-3": 0,
        "3-4": 0,
        "4-5": 0
    },
    fileStorage: {
        hasFile: false,
        fileName: null,
        fileContent: null,
        fileSize: 0
    },
    nextGameId: 1,
    nextCompanyId: 1
};

// Initialize with sample data
const initializeSampleData = () => {
    // Sample companies
    localData.companies = [
        {
            Id: 1,
            CompanyName: "Epic Games Inc.",
            NetWorth: 28700000000,
            LogoID: "epic_games_logo",
            Description: "American video game and software developer and publisher based in Cary, North Carolina."
        },
        {
            Id: 2,
            CompanyName: "Blizzard Entertainment",
            NetWorth: 18200000000,
            LogoID: "blizzard_logo",
            Description: "American video game developer and publisher known for World of Warcraft, Overwatch, and Diablo series."
        },
        {
            Id: 3,
            CompanyName: "Valve Corporation",
            NetWorth: 10000000000,
            LogoID: "valve_logo",
            Description: "American video game developer and digital distribution company, creators of Steam platform."
        }
    ];    // Sample games
    localData.games = [
        {
            Id: 1,
            CompanyID: 1,
            Name: "Epic Adventure Quest",
            IconID: "adventure_icon",
            Price: 29.99,
            Rating: 4.5,
            Description: "Embark on an epic adventure through mystical lands filled with challenges, treasures, and legendary creatures. Perfect for solo or multiplayer gameplay.",
            Genres: ["Adventure", "RPG", "Action"],
            Platforms: ["PC", "Xbox", "PlayStation"]
        },
        {
            Id: 2,
            CompanyID: 2,
            Name: "Space Commander",
            IconID: "space_icon",
            Price: 39.99,
            Rating: 4.2,
            Description: "Command your own spaceship and explore the galaxy in this thrilling space simulation game. Build, trade, and fight your way to becoming the ultimate space commander.",
            Genres: ["Strategy", "Simulation", "Sci-Fi"],
            Platforms: ["PC", "Nintendo Switch", "Mobile"]
        },
        {
            Id: 3,
            CompanyID: 3,
            Name: "Puzzle Master Pro",
            IconID: "puzzle_icon",
            Price: 19.99,
            Rating: 3.8,
            Description: "Challenge your mind with hundreds of intricate puzzles. From simple brain teasers to complex multi-dimensional challenges.",
            Genres: ["Puzzle", "Casual", "Educational"],
            Platforms: ["PC", "Mobile", "Tablet"]
        }
    ];    localData.nextGameId = 4;
    localData.nextCompanyId = 4;
    updateRatingDistribution();
};

// Helper functions
const updateRatingDistribution = () => {
    const distribution = {
        "1-2": 0,
        "2-3": 0,
        "3-4": 0,
        "4-5": 0
    };    localData.games.forEach(game => {
        if (game.Rating >= 1 && game.Rating < 2) distribution["1-2"]++;
        else if (game.Rating >= 2 && game.Rating < 3) distribution["2-3"]++;
        else if (game.Rating >= 3 && game.Rating < 4) distribution["3-4"]++;
        else if (game.Rating >= 4 && game.Rating <= 5) distribution["4-5"]++;
    });

    localData.ratingDistribution = distribution;
};

const logAction = (actionType, message, status = "200 OK", additionalData = {}) => {
    const logEntry = {
        Id: crypto.randomUUID(),
        ActionType: actionType,
        Message: message,
        Status: status,
        Timestamp: new Date().toISOString(),
        ClientIpAddress: "127.0.0.1",
        DurationMs: Math.floor(Math.random() * 50) + 10, // Local response time: 10-60ms
        ...additionalData
    };

    localData.logs.push(logEntry);
    // Client-side logging - matches browser console format
    console.log(`[${new Date().toISOString()}] ${actionType}: ${message} (${logEntry.DurationMs}ms)`);
    return logEntry;
};

const findCompanyById = (id) => {
    return localData.companies.find(c => c.Id === id) || {
        Id: -1,
        CompanyName: "",
        NetWorth: 0,
        LogoID: "",
        Description: ""
    };
};

const addCompanyToGame = (game) => {
    if (game.CompanyID && game.CompanyID !== -1) {
        const company = findCompanyById(game.CompanyID);
        return { ...game, Company: company, CompanyName: company.CompanyName };
    }
    return {
        ...game,
        Company: { Id: -1, CompanyName: "", NetWorth: 0, LogoID: "", Description: "" },
        CompanyName: ""
    };
};

// Validation functions
const validateGame = (game) => {
    if (!game.Name || game.Name.trim() === "") return false;
    if (game.Price <= 0) return false;
    if (game.Rating < 1 || game.Rating > 5) return false;
    if (!game.Genres || !Array.isArray(game.Genres)) return false;
    if (!game.Platforms || !Array.isArray(game.Platforms)) return false;
    if (!game.Description || game.Description.trim() === "") return false;
    return true;
};

const validateCompany = (company) => {
    if (!company.CompanyName || company.CompanyName.trim() === "") return false;
    if (company.NetWorth < 0) return false;
    if (!company.Description || company.Description.trim() === "") return false;
    return true;
};

// Filtering and sorting functions
const filterAndSortGames = (games, params) => {
    let filteredGames = [...games];

    // Search by name
    if (params.SearchText) {
        filteredGames = filteredGames.filter(g => 
            g.Name.toLowerCase().includes(params.SearchText.toLowerCase())
        );
    }

    // Search by company name
    if (params.CompanySearchText) {
        filteredGames = filteredGames.filter(g => {
            const company = findCompanyById(g.CompanyID);
            return company.CompanyName.toLowerCase().includes(params.CompanySearchText.toLowerCase());
        });
    }

    // Filter by genres
    if (params.Genres && params.Genres.length > 0) {
        filteredGames = filteredGames.filter(g => 
            params.Genres.every(genre => g.Genres.includes(genre))
        );
    }

    // Filter by platforms
    if (params.Platforms && params.Platforms.length > 0) {
        filteredGames = filteredGames.filter(g => 
            params.Platforms.every(platform => g.Platforms.includes(platform))
        );
    }

    // Sort games
    if (params.SortBy) {
        const ascending = params.Ascending !== false;
        
        switch (params.SortBy.toLowerCase()) {
            case "price":
                filteredGames.sort((a, b) => ascending ? a.Price - b.Price : b.Price - a.Price);
                break;
            case "rating":
                filteredGames.sort((a, b) => ascending ? a.Rating - b.Rating : b.Rating - a.Rating);
                break;
            case "name":
                filteredGames.sort((a, b) => {
                    const compare = a.Name.localeCompare(b.Name);
                    return ascending ? compare : -compare;
                });
                break;
        }
    }

    return filteredGames;
};

const filterAndSortCompanies = (companies, params) => {
    let filteredCompanies = [...companies];

    // Search by name
    if (params.SearchText) {
        filteredCompanies = filteredCompanies.filter(c => 
            c.CompanyName.toLowerCase().includes(params.SearchText.toLowerCase())
        );
    }

    // Sort companies
    if (params.SortBy) {
        const ascending = params.Ascending !== false;
        
        switch (params.SortBy.toLowerCase()) {
            case "name":
                filteredCompanies.sort((a, b) => {
                    const compare = a.CompanyName.localeCompare(b.CompanyName);
                    return ascending ? compare : -compare;
                });
                break;
            case "networth":
                filteredCompanies.sort((a, b) => ascending ? a.NetWorth - b.NetWorth : b.NetWorth - a.NetWorth);
                break;
        }
    }

    return filteredCompanies;
};

// Simulated API delay
const simulateDelay = () => {
    const delay = Math.floor(Math.random() * 100) + 50; // 50-150ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
};

// Game generation names and data
const gameNames = [
    "Epic Adventure", "Space Odyssey", "Dragon Quest", "Shadow Warrior", "Magic Kingdom",
    "Cyber Runner", "Forest Tales", "Ocean Explorer", "Sky Battle", "Desert Storm",
    "Crystal Caves", "Fire Mountain", "Ice Palace", "Thunder Valley", "Wind Walker",
    "Star Fighter", "Mystic Legends", "Battle Royale", "Racing Thunder", "Puzzle Master"
];

const gameGenres = [
    "Action", "Adventure", "RPG", "Strategy", "Simulation", "Puzzle", "Sports", 
    "Racing", "Fighting", "Shooter", "Platformer", "Horror", "Casual", "Educational"
];

const gamePlatforms = [
    "PC", "Xbox", "PlayStation", "Nintendo Switch", "Mobile", "Tablet", "VR"
];

// Local Backend API
const localBackend = {
    // Initialize the backend
    initialize: () => {
        console.log("Initializing local backend...");
        initializeSampleData();
        console.log("Local backend initialized with sample data");
    },

    // Game endpoints
    games: {        getAll: async (params = {}) => {
            await simulateDelay();
            
            const filteredGames = filterAndSortGames(localData.games, params);
            const gamesWithCompanies = filteredGames.map(addCompanyToGame);
            
            logAction("GetGames", `Retrieved ${gamesWithCompanies.length} games with filter: ${JSON.stringify(params)}`);
            
            return gamesWithCompanies.map(game => ({
                id: game.Id,
                name: game.Name,
                price: game.Price,
                description: game.Description,
                iconID: game.IconID,
                rating: game.Rating,
                genres: game.Genres,
                platforms: game.Platforms,
                companyID: game.CompanyID,
                companyName: game.CompanyName || ""
            }));
        },        getById: async (id) => {
            await simulateDelay();
            
            const game = localData.games.find(g => g.Id === id);
            if (!game) {
                logAction("GetGameById", `Game with ID ${id} not found`, "404 Not Found");
                throw new Error(`Game with ID ${id} not found`);
            }
            
            const gameWithCompany = addCompanyToGame(game);
            logAction("GetGameById", `Retrieved game with ID: ${id}`);
            
            return {
                id: gameWithCompany.Id,
                name: gameWithCompany.Name,
                price: gameWithCompany.Price,
                description: gameWithCompany.Description,
                iconID: gameWithCompany.IconID,
                rating: gameWithCompany.Rating,
                genres: gameWithCompany.Genres,
                platforms: gameWithCompany.Platforms,
                companyID: gameWithCompany.CompanyID,
                companyName: gameWithCompany.CompanyName || ""
            };
        },

        modify: async (gameData) => {
            await simulateDelay();
            
            // Convert from DTO format to internal format
            const game = {
                Id: gameData.Id || 0,
                Name: gameData.Name,
                Price: gameData.Price,
                Description: gameData.Description,
                IconID: gameData.IconID,
                Rating: gameData.Rating,
                Genres: gameData.Genres || [],
                Platforms: gameData.Platforms || [],
                CompanyID: gameData.CompanyID || -1
            };

            if (!validateGame(game)) {
                logAction("ModifyGame", `Invalid game data for ${game.Name}`, "400 Bad Request");
                throw new Error("Invalid game data");
            }

            const isUpdate = game.Id !== 0;
            let resultGame;            if (isUpdate) {
                // Update existing game
                const index = localData.games.findIndex(g => g.Id === game.Id);
                if (index === -1) {
                    logAction("UpdateGame", `Game with ID ${game.Id} not found`, "404 Not Found");
                    throw new Error(`Game with ID ${game.Id} not found`);
                }
                
                localData.games[index] = { ...localData.games[index], ...game };
                resultGame = localData.games[index];
                logAction("UpdateGame", `Updated game: ${game.Name} (ID: ${game.Id})`);
            } else {
                // Add new game
                game.Id = localData.nextGameId++;
                localData.games.push(game);
                resultGame = game;
                logAction("CreateGame", `Created game: ${game.Name} (ID: ${game.Id})`);
            }

            updateRatingDistribution();
            const gameWithCompany = addCompanyToGame(resultGame);
            
            return {
                id: gameWithCompany.Id,
                name: gameWithCompany.Name,
                price: gameWithCompany.Price,
                description: gameWithCompany.Description,
                iconID: gameWithCompany.IconID,
                rating: gameWithCompany.Rating,
                genres: gameWithCompany.Genres,
                platforms: gameWithCompany.Platforms,
                companyID: gameWithCompany.CompanyID,
                companyName: gameWithCompany.CompanyName || ""
            };
        },        delete: async (id) => {
            await simulateDelay();
            
            const index = localData.games.findIndex(g => g.Id === id);
            if (index === -1) {
                logAction("DeleteGame", `Game with ID ${id} not found`, "404 Not Found");
                throw new Error(`Game with ID ${id} not found`);
            }
            
            const deletedGame = localData.games.splice(index, 1)[0];
            updateRatingDistribution();
            logAction("DeleteGame", `Deleted game with ID: ${id}`);
            
            return { success: true, status: 200 };
        },        // Game generation for WebSocket
        generateRandomGame: () => {
            const game = {
                Id: localData.nextGameId++,
                Name: gameNames[Math.floor(Math.random() * gameNames.length)] + " " + Math.floor(Math.random() * 1000),
                Price: Math.floor(Math.random() * 60) + 0.99,
                Rating: Number((Math.floor(Math.random() * 10) / 10 * 4.5 + 1).toFixed(1)),
                Description: "Epic game where you do this and that and something else and you can (probably) do it with your friends or alone and also lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                IconID: "game_icon_" + Math.floor(Math.random() * 100),
                Genres: [gameGenres[Math.floor(Math.random() * gameGenres.length)]],
                Platforms: [gamePlatforms[Math.floor(Math.random() * gamePlatforms.length)]],
                CompanyID: localData.companies.length > 0 ? 
                    localData.companies[Math.floor(Math.random() * localData.companies.length)].Id : -1
            };

            localData.games.push(game);
            updateRatingDistribution();
            logAction("GenerateGame", `Generated new game: ${game.Name} (ID: ${game.Id})`);
            
            return addCompanyToGame(game);
        }
    },    // Company endpoints
    companies: {
        getAll: async (params = {}) => {
            await simulateDelay();
            
            const filteredCompanies = filterAndSortCompanies(localData.companies, params);
            logAction("GetCompanies", `Retrieved ${filteredCompanies.length} companies with filter: ${JSON.stringify(params)}`);
            
            return filteredCompanies;
        },

        getById: async (id) => {
            await simulateDelay();
            
            const company = localData.companies.find(c => c.Id === id);
            if (!company) {
                logAction("GetCompanyById", `Company with ID ${id} not found`, "404 Not Found");
                throw new Error(`Company with ID ${id} not found`);
            }
            
            logAction("GetCompanyById", `Retrieved company with ID: ${id}`);
            return company;
        },

        modify: async (company) => {
            await simulateDelay();
            
            if (!validateCompany(company)) {
                logAction("ModifyCompany", `Invalid company data for ${company.CompanyName}`, "400 Bad Request");
                throw new Error("Invalid company data");
            }

            const isUpdate = company.Id !== 0 && localData.companies.find(c => c.Id === company.Id);
            let resultCompany;

            if (isUpdate) {
                // Update existing company
                const index = localData.companies.findIndex(c => c.Id === company.Id);
                localData.companies[index] = { ...localData.companies[index], ...company };
                resultCompany = localData.companies[index];
                logAction("UpdateCompany", `Updated company: ${company.CompanyName} (ID: ${company.Id})`);
            } else {
                // Add new company
                company.Id = localData.nextCompanyId++;
                localData.companies.push(company);
                resultCompany = company;
                logAction("CreateCompany", `Created company: ${company.CompanyName} (ID: ${company.Id})`);
            }
            
            return resultCompany;
        },

        delete: async (id) => {
            await simulateDelay();
            
            const index = localData.companies.findIndex(c => c.Id === id);
            if (index === -1) {
                logAction("DeleteCompany", `Company with ID ${id} not found`, "404 Not Found");
                throw new Error(`Company with ID ${id} not found`);
            }
            
            const deletedCompany = localData.companies.splice(index, 1)[0];
            
            // Update games that belonged to this company
            localData.games.forEach(game => {
                if (game.CompanyID === id) {
                    game.CompanyID = -1;
                }
            });
            
            logAction("DeleteCompany", `Deleted company with ID: ${id}`);
            return { success: true, status: 200 };
        }
    },

    // Health endpoint
    health: {
        check: async () => {
            await simulateDelay();
            return {
                status: "healthy",
                time: new Date().toISOString()
            };
        },

        echo: async (message) => {
            await simulateDelay();
            return {
                received: message,
                timestamp: new Date().toISOString(),
                headers: { "simulated": "true" }
            };
        }
    },    // Rating chart endpoint
    ratingChart: {
        getRatingDistribution: async () => {
            await simulateDelay();
            
            logAction("GetRatingDistribution", "Retrieved rating distribution data");
            return localData.ratingDistribution;
        }
    },

    // File endpoints
    files: {
        upload: async (file) => {
            await simulateDelay();
            
            localData.fileStorage = {
                hasFile: true,
                fileName: file.name,
                fileContent: await file.arrayBuffer(),
                fileSize: file.size
            };
            
            logAction("FileUpload", `Uploaded file: ${file.name} (${file.size} bytes)`);
            return {
                message: "File uploaded successfully",
                fileName: file.name,
                fileSize: file.size
            };
        },

        download: async () => {
            await simulateDelay();
            
            if (!localData.fileStorage.hasFile) {
                logAction("FileDownload", "No file found on server", "404 Not Found");
                throw new Error("No file found on server");
            }
            
            const blob = new Blob([localData.fileStorage.fileContent]);
            logAction("FileDownload", `Downloaded file: ${localData.fileStorage.fileName}`);
            
            return {
                blob,
                filename: localData.fileStorage.fileName,
                contentType: "application/octet-stream"
            };
        },

        exists: async () => {
            await simulateDelay();
            
            logAction("FileExists", `File exists check: ${localData.fileStorage.hasFile}`);
            return {
                exists: localData.fileStorage.hasFile
            };
        }
    },    // Log endpoints (for debugging/monitoring)
    logs: {
        getAll: async () => {
            await simulateDelay();
            return localData.logs;
        },

        getRecent: async (count = 50) => {
            await simulateDelay();
            return localData.logs.slice(-count);
        },

        clear: async () => {
            await simulateDelay();
            localData.logs = [];
            return { success: true };
        }
    },

    // Data management
    data: {
        export: () => {
            return JSON.stringify(localData, null, 2);
        },

        import: (jsonData) => {
            try {
                localData = JSON.parse(jsonData);
                console.log("Imported local data successfully");
                return true;
            } catch (error) {
                console.error("Failed to import data:", error);
                return false;
            }
        },reset: () => {
            initializeSampleData();
            console.log("Reset local data to initial state");
        }
    }
};

// Initialize on import
localBackend.initialize();

// Export as default
export default localBackend;

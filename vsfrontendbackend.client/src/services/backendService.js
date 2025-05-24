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
    games: [
            {
                Id: 1,
                Name: "Epic Adventure Quest",
                Price: 29.99,
                Description: "Embark on an epic adventure through mystical lands filled with challenges, treasures, and legendary creatures.",
                IconID: "DeathsDoorIcon",
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
                IconID: "NMSIcon",
                Rating: 4.2,
                Genres: ["Strategy", "Simulation", "Sci-Fi"],
                Platforms: ["PC", "Nintendo Switch", "Mobile"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 3,
                Name: "Cyber Chronicles",
                Price: 49.99,
                Description: "Enter a dystopian future where cybernetic enhancements blur the line between human and machine.",
                IconID: "BPMIcon",
                Rating: 4.7,
                Genres: ["RPG", "Cyberpunk", "Action"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 4,
                Name: "Mystic Realms",
                Price: 24.99,
                Description: "Discover hidden powers and ancient magic in a world on the brink of chaos.",
                IconID: "DeadCellsIcon",
                Rating: 4.1,
                Genres: ["Fantasy", "Adventure", "Puzzle"],
                Platforms: ["PC", "Mobile", "Nintendo Switch"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 5,
                Name: "Quantum Nexus",
                Price: 34.99,
                Description: "Navigate through parallel universes where your choices create and destroy entire realities.",
                IconID: "Portal2Icon",
                Rating: 4.8,
                Genres: ["Sci-Fi", "Puzzle", "Adventure"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 6,
                Name: "Stellar Odyssey",
                Price: 19.99,
                Description: "Explore uncharted star systems and establish colonies across the galaxy.",
                IconID: "NMSIcon",
                Rating: 3.9,
                Genres: ["Strategy", "Simulation", "Sci-Fi"],
                Platforms: ["PC", "Mac", "Linux"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 7,
                Name: "Shadow Warriors",
                Price: 29.99,
                Description: "Master the ancient arts of stealth and combat as you seek revenge against the clan that betrayed you.",
                IconID: "KillKnightIcon",
                Rating: 4.3,
                Genres: ["Action", "Stealth", "Martial Arts"],
                Platforms: ["PlayStation", "Xbox", "PC"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 8,
                Name: "Crystal Kingdoms",
                Price: 44.99,
                Description: "Build and defend your kingdom in a world where magical crystals power civilization.",
                IconID: "SlayTheSpireIcon",
                Rating: 4.0,
                Genres: ["Strategy", "City-building", "Fantasy"],
                Platforms: ["PC", "Mac", "Mobile"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 9,
                Name: "Eternal Dungeons",
                Price: 14.99,
                Description: "Descend into procedurally generated dungeons filled with monsters, traps, and legendary treasures.",
                IconID: "ROR2Icon",
                Rating: 4.6,
                Genres: ["Roguelike", "Dungeon Crawler", "RPG"],
                Platforms: ["PC", "Nintendo Switch", "PlayStation"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 10,
                Name: "Tech Tycoon",
                Price: 39.99,
                Description: "Build your tech empire from a garage startup to a global corporation that shapes the future.",
                IconID: "SuperHotIcon",
                Rating: 3.8,
                Genres: ["Simulation", "Strategy", "Business"],
                Platforms: ["PC", "Mac", "Mobile"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 11,
                Name: "Dragon Hunters",
                Price: 49.99,
                Description: "Form a party of unique heroes to track and slay legendary dragons threatening the realm.",
                IconID: "PalworldIcon",
                Rating: 4.4,
                Genres: ["RPG", "Action", "Adventure"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 12,
                Name: "Frozen Frontiers",
                Price: 24.99,
                Description: "Survive in a post-apocalyptic frozen wasteland where resources are scarce and dangers abundant.",
                IconID: "LethalCompIcon",
                Rating: 4.2,
                Genres: ["Survival", "Open World", "Crafting"],
                Platforms: ["PC", "Xbox", "PlayStation"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 13,
                Name: "Blazing Rebellion",
                Price: 34.99,
                Description: "Lead the resistance against a tyrannical empire with revolutionary tactics and guerrilla warfare.",
                IconID: "REPOIcon",
                Rating: 3.7,
                Genres: ["Strategy", "Action", "FPS"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 14,
                Name: "Void Explorers",
                Price: 29.99,
                Description: "Venture into the mysterious Void, a dimension beyond space and time with its own bizarre laws of physics.",
                IconID: "DBDIcon",
                Rating: 3.5,
                Genres: ["Horror", "Adventure", "Puzzle"],
                Platforms: ["PC", "PlayStation", "VR"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 15,
                Name: "Primal Survivors",
                Price: 19.99,
                Description: "Return to the stone age where primitive humans must evolve and adapt to survive against prehistoric threats.",
                IconID: "DarkNDIcon",
                Rating: 4.0,
                Genres: ["Survival", "Simulation", "Crafting"],
                Platforms: ["PC", "Xbox", "Mobile"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 16,
                Name: "Phantom Tactics",
                Price: 24.99,
                Description: "Command a squad of ghost operatives with unique supernatural abilities on high-stakes missions.",
                IconID: "DeathsDoorIcon",
                Rating: 4.3,
                Genres: ["Tactical", "Strategy", "Supernatural"],
                Platforms: ["PC", "Nintendo Switch", "PlayStation"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 17,
                Name: "Mega Racers",
                Price: 39.99,
                Description: "Compete in high-octane races across impossible tracks with physics-defying vehicles and power-ups.",
                IconID: "AmogusIcon",
                Rating: 4.1,
                Genres: ["Racing", "Arcade", "Multiplayer"],
                Platforms: ["PlayStation", "Xbox", "PC"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 18,
                Name: "Astral Siege",
                Price: 29.99,
                Description: "Defend your space colony against waves of alien invaders using advanced weaponry and tactical planning.",
                IconID: "NMSIcon",
                Rating: 3.9,
                Genres: ["Tower Defense", "Strategy", "Sci-Fi"],
                Platforms: ["PC", "Mobile", "Mac"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 19,
                Name: "Mystic Wizards",
                Price: 24.99,
                Description: "Attend a prestigious academy for wizards where you'll learn powerful spells and uncover ancient conspiracies.",
                IconID: "DuolingoIcon",
                Rating: 4.5,
                Genres: ["RPG", "Fantasy", "Adventure"],
                Platforms: ["PC", "PlayStation", "Nintendo Switch"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 20,
                Name: "Neon Infiltrator",
                Price: 19.99,
                Description: "Hack into corporate systems and infiltrate heavily guarded facilities in a neon-lit cyberpunk world.",
                IconID: "SuperHotIcon",
                Rating: 4.2,
                Genres: ["Stealth", "Hacking", "Cyberpunk"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 21,
                Name: "Pixel Dungeons",
                Price: 9.99,
                Description: "Navigate through retro-style pixel art dungeons with challenging puzzles and nostalgic gameplay.",
                IconID: "SlayTheSpireIcon",
                Rating: 4.0,
                Genres: ["Retro", "Puzzle", "Platformer"],
                Platforms: ["PC", "Mobile", "Nintendo Switch"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 22,
                Name: "Ultra Titans",
                Price: 54.99,
                Description: "Pilot massive mechs in epic battles that will determine the fate of human civilization on distant planets.",
                IconID: "BPMIcon",
                Rating: 4.7,
                Genres: ["Mech", "Action", "Sci-Fi"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            }
        ],
    companies: [
            {
                Id: 1,
                CompanyName: "Adventure Studios",
                NetWorth: 5000000,
                LogoID: "ROR2Icon",
                Description: "Creating epic adventure games since 2005",
                Games: [] // Will be populated with references to games
            },
            {
                Id: 2,
                CompanyName: "Cosmic Games",
                NetWorth: 3500000,
                LogoID: "NMSIcon",
                Description: "Specializing in space and sci-fi gaming experiences",
                Games: [] // Will be populated with references to games
            }
        ],
    currentFile: null,
    ratingDistribution: {
        "1-2": 0,
        "2-3": 0,
        "3-4": 7,
        "4-5": 15
    }
};

// Initialize with some default data if empty
const initializeDataStore = () => {
    // Check if we have stored data in localStorage
    var savedGames = localStorage.getItem('gamesInfo');
    var savedCompanies = localStorage.getItem('companiesInfo');

    // savedGames = null;
    // savedCompanies = null;

    if (savedCompanies) {
        dataStore.companies = JSON.parse(savedCompanies);
    } else if (dataStore.companies.length === 0) {
        // Update companies to match the C# model (Company.cs)
        dataStore.companies = [
            {
                Id: 1,
                CompanyName: "Adventure Studios",
                NetWorth: 5000000,
                LogoID: "ROR2Icon", // Updated to use a valid icon ID
                Description: "Creating epic adventure games since 2005",
                Games: [] // Will be populated with references to games
            },
            {
                Id: 2,
                CompanyName: "Cosmic Games",
                NetWorth: 3500000,
                LogoID: "NMSIcon", // Updated to use a valid icon ID
                Description: "Specializing in space and sci-fi gaming experiences",
                Games: [] // Will be populated with references to games
            }
        ];
        localStorage.setItem('companiesInfo', JSON.stringify(dataStore.companies));
    }
    
    if (savedGames) {
        dataStore.games = JSON.parse(savedGames);
    } else if (dataStore.games.length === 0) {
        // Games structure already matches GameDTO.cs
        dataStore.games = [
            {
                Id: 1,
                Name: "Epic Adventure Quest",
                Price: 29.99,
                Description: "Embark on an epic adventure through mystical lands filled with challenges, treasures, and legendary creatures.",
                IconID: "DeathsDoorIcon", // Updated to use a valid icon ID
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
                IconID: "NMSIcon", // Updated to use a valid icon ID
                Rating: 4.2,
                Genres: ["Strategy", "Simulation", "Sci-Fi"],
                Platforms: ["PC", "Nintendo Switch", "Mobile"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 3,
                Name: "Cyber Chronicles",
                Price: 49.99,
                Description: "Enter a dystopian future where cybernetic enhancements blur the line between human and machine.",
                IconID: "BPMIcon", // Updated to use a valid icon ID
                Rating: 4.7,
                Genres: ["RPG", "Cyberpunk", "Action"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 4,
                Name: "Mystic Realms",
                Price: 24.99,
                Description: "Discover hidden powers and ancient magic in a world on the brink of chaos.",
                IconID: "DeadCellsIcon", // Updated to use a valid icon ID
                Rating: 4.1,
                Genres: ["Fantasy", "Adventure", "Puzzle"],
                Platforms: ["PC", "Mobile", "Nintendo Switch"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 5,
                Name: "Quantum Nexus",
                Price: 34.99,
                Description: "Navigate through parallel universes where your choices create and destroy entire realities.",
                IconID: "Portal2Icon", // Updated to use a valid icon ID
                Rating: 4.8,
                Genres: ["Sci-Fi", "Puzzle", "Adventure"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 6,
                Name: "Stellar Odyssey",
                Price: 19.99,
                Description: "Explore uncharted star systems and establish colonies across the galaxy.",
                IconID: "NMSIcon", // Updated to use a valid icon ID
                Rating: 3.9,
                Genres: ["Strategy", "Simulation", "Sci-Fi"],
                Platforms: ["PC", "Mac", "Linux"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 7,
                Name: "Shadow Warriors",
                Price: 29.99,
                Description: "Master the ancient arts of stealth and combat as you seek revenge against the clan that betrayed you.",
                IconID: "KillKnightIcon", // Updated to use a valid icon ID
                Rating: 4.3,
                Genres: ["Action", "Stealth", "Martial Arts"],
                Platforms: ["PlayStation", "Xbox", "PC"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 8,
                Name: "Crystal Kingdoms",
                Price: 44.99,
                Description: "Build and defend your kingdom in a world where magical crystals power civilization.",
                IconID: "SlayTheSpireIcon", // Updated to use a valid icon ID
                Rating: 4.0,
                Genres: ["Strategy", "City-building", "Fantasy"],
                Platforms: ["PC", "Mac", "Mobile"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 9,
                Name: "Eternal Dungeons",
                Price: 14.99,
                Description: "Descend into procedurally generated dungeons filled with monsters, traps, and legendary treasures.",
                IconID: "ROR2Icon", // Updated to use a valid icon ID
                Rating: 4.6,
                Genres: ["Roguelike", "Dungeon Crawler", "RPG"],
                Platforms: ["PC", "Nintendo Switch", "PlayStation"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 10,
                Name: "Tech Tycoon",
                Price: 39.99,
                Description: "Build your tech empire from a garage startup to a global corporation that shapes the future.",
                IconID: "SuperHotIcon", // Updated to use a valid icon ID
                Rating: 3.8,
                Genres: ["Simulation", "Strategy", "Business"],
                Platforms: ["PC", "Mac", "Mobile"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 11,
                Name: "Dragon Hunters",
                Price: 49.99,
                Description: "Form a party of unique heroes to track and slay legendary dragons threatening the realm.",
                IconID: "PalworldIcon", // Updated to use a valid icon ID
                Rating: 4.4,
                Genres: ["RPG", "Action", "Adventure"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 12,
                Name: "Frozen Frontiers",
                Price: 24.99,
                Description: "Survive in a post-apocalyptic frozen wasteland where resources are scarce and dangers abundant.",
                IconID: "LethalCompIcon", // Updated to use a valid icon ID
                Rating: 4.2,
                Genres: ["Survival", "Open World", "Crafting"],
                Platforms: ["PC", "Xbox", "PlayStation"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 13,
                Name: "Blazing Rebellion",
                Price: 34.99,
                Description: "Lead the resistance against a tyrannical empire with revolutionary tactics and guerrilla warfare.",
                IconID: "REPOIcon", // Updated to use a valid icon ID
                Rating: 3.7,
                Genres: ["Strategy", "Action", "FPS"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 14,
                Name: "Void Explorers",
                Price: 29.99,
                Description: "Venture into the mysterious Void, a dimension beyond space and time with its own bizarre laws of physics.",
                IconID: "DBDIcon", // Updated to use a valid icon ID
                Rating: 3.5,
                Genres: ["Horror", "Adventure", "Puzzle"],
                Platforms: ["PC", "PlayStation", "VR"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 15,
                Name: "Primal Survivors",
                Price: 19.99,
                Description: "Return to the stone age where primitive humans must evolve and adapt to survive against prehistoric threats.",
                IconID: "DarkNDIcon", // Updated to use a valid icon ID
                Rating: 4.0,
                Genres: ["Survival", "Simulation", "Crafting"],
                Platforms: ["PC", "Xbox", "Mobile"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 16,
                Name: "Phantom Tactics",
                Price: 24.99,
                Description: "Command a squad of ghost operatives with unique supernatural abilities on high-stakes missions.",
                IconID: "DeathsDoorIcon", // Updated to use a valid icon ID
                Rating: 4.3,
                Genres: ["Tactical", "Strategy", "Supernatural"],
                Platforms: ["PC", "Nintendo Switch", "PlayStation"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 17,
                Name: "Mega Racers",
                Price: 39.99,
                Description: "Compete in high-octane races across impossible tracks with physics-defying vehicles and power-ups.",
                IconID: "AmogusIcon", // Updated to use a valid icon ID
                Rating: 4.1,
                Genres: ["Racing", "Arcade", "Multiplayer"],
                Platforms: ["PlayStation", "Xbox", "PC"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 18,
                Name: "Astral Siege",
                Price: 29.99,
                Description: "Defend your space colony against waves of alien invaders using advanced weaponry and tactical planning.",
                IconID: "NMSIcon", // Updated to use a valid icon ID
                Rating: 3.9,
                Genres: ["Tower Defense", "Strategy", "Sci-Fi"],
                Platforms: ["PC", "Mobile", "Mac"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 19,
                Name: "Mystic Wizards",
                Price: 24.99,
                Description: "Attend a prestigious academy for wizards where you'll learn powerful spells and uncover ancient conspiracies.",
                IconID: "DuolingoIcon", // Updated to use a valid icon ID
                Rating: 4.5,
                Genres: ["RPG", "Fantasy", "Adventure"],
                Platforms: ["PC", "PlayStation", "Nintendo Switch"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 20,
                Name: "Neon Infiltrator",
                Price: 19.99,
                Description: "Hack into corporate systems and infiltrate heavily guarded facilities in a neon-lit cyberpunk world.",
                IconID: "SuperHotIcon", // Updated to use a valid icon ID
                Rating: 4.2,
                Genres: ["Stealth", "Hacking", "Cyberpunk"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            },
            {
                Id: 21,
                Name: "Pixel Dungeons",
                Price: 9.99,
                Description: "Navigate through retro-style pixel art dungeons with challenging puzzles and nostalgic gameplay.",
                IconID: "SlayTheSpireIcon", // Updated to use a valid icon ID
                Rating: 4.0,
                Genres: ["Retro", "Puzzle", "Platformer"],
                Platforms: ["PC", "Mobile", "Nintendo Switch"],
                CompanyID: 1,
                CompanyName: "Adventure Studios"
            },
            {
                Id: 22,
                Name: "Ultra Titans",
                Price: 54.99,
                Description: "Pilot massive mechs in epic battles that will determine the fate of human civilization on distant planets.",
                IconID: "BPMIcon", // Updated to use a valid icon ID
                Rating: 4.7,
                Genres: ["Mech", "Action", "Sci-Fi"],
                Platforms: ["PC", "PlayStation", "Xbox"],
                CompanyID: 2,
                CompanyName: "Cosmic Games"
            }
        ]
    };
};

// Call initialization
initializeDataStore();

useEffect(() => {
  const currentVersion = '1.0.1'; // Change this when deploying new version
  const storedVersion = localStorage.getItem('appVersion');

  if (storedVersion !== currentVersion) {
    localStorage.clear(); // Clear only when version changes
    localStorage.setItem('appVersion', currentVersion);
    console.log('localStorage cleared due to version change');
  }
}, []);

// Utility functions
const filterGames = (games, params) => {
    let filtered = [...games];
    
    console.log('Filtering games with params:', params);

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
            // Ensure CompanyName is set based on CompanyID
            const company = dataStore.companies.find(c => c.Id === game.CompanyID);
            if (company) {
                game.CompanyName = company.CompanyName;
            } else if (game.CompanyID > 0) {
                // If company not found but ID is provided, use empty company
                game.CompanyName = "Unknown Company";
            }
            
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
            
            // Update company-game relationships
            updateCompanyGameReferences();
            
            // Update localStorage
            localStorage.setItem('gamesInfo', JSON.stringify(dataStore.games));
            localStorage.setItem('companiesInfo', JSON.stringify(dataStore.companies));
            
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
                
                // Update company-game relationships
                updateCompanyGameReferences();
                
                localStorage.setItem('gamesInfo', JSON.stringify(dataStore.games));
                localStorage.setItem('companiesInfo', JSON.stringify(dataStore.companies));
                
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
            // Ensure company has a Games array
            if (!company.Games) {
                company.Games = [];
            }
            
            if (company.Id) {
                // Update existing company
                const index = dataStore.companies.findIndex(c => c.Id === company.Id);
                if (index !== -1) {
                    // Preserve existing Games collection if not provided
                    if (company.Games.length === 0 && dataStore.companies[index].Games) {
                        company.Games = dataStore.companies[index].Games;
                    }
                    dataStore.companies[index] = { ...company };
                    
                    // Update CompanyName in all games that reference this company
                    dataStore.games.forEach(game => {
                        if (game.CompanyID === company.Id) {
                            game.CompanyName = company.CompanyName;
                        }
                    });
                } else {
                    return createResponse({ error: 'Company not found' }, 404);
                }
            } else {
                // Create new company
                const newId = Math.max(0, ...dataStore.companies.map(c => c.Id)) + 1;
                const newCompany = { 
                    ...company, 
                    Id: newId,
                    Games: []
                };
                dataStore.companies.push(newCompany);
                company = newCompany;
            }
            
            // Update localStorage
            localStorage.setItem('companiesInfo', JSON.stringify(dataStore.companies));
            localStorage.setItem('gamesInfo', JSON.stringify(dataStore.games));
            
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
                // Check if company has games
                const hasGames = dataStore.games.some(g => g.CompanyID === id);
                if (hasGames) {
                    return createResponse({ 
                        error: 'Cannot delete company that has games. Delete the games first or reassign them to another company.' 
                    }, 400);
                }
                
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
            // Dynamically calculate distribution based on current games
            if (dataStore.games.length > 0) {
                const distribution = {
                    "1-2": 0,
                    "2-3": 0,
                    "3-4": 0,
                    "4-5": 0
                };
                
                dataStore.games.forEach(game => {
                    if (game.Rating >= 1 && game.Rating < 2) distribution["1-2"]++;
                    else if (game.Rating >= 2 && game.Rating < 3) distribution["2-3"]++;
                    else if (game.Rating >= 3 && game.Rating < 4) distribution["3-4"]++;
                    else if (game.Rating >= 4 && game.Rating <= 5) distribution["4-5"]++;
                });
                
                dataStore.ratingDistribution = distribution;
                localStorage.setItem('ratingDistribution', JSON.stringify(distribution));
            }
            
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

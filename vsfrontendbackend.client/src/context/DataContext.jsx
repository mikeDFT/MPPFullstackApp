import React, {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';
import { iconsIDToObjs } from '@/utils/IconIDs.jsx';
import { DEFAULT_PLATFORMS, DEFAULT_GENRES } from '@/utils/GenresPlatforms.jsx';
import { apiService } from '@/services/apiService.js';

// Create the context
const DataContext = createContext();

// Custom hook to use the data
export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

// Provider component
export function DataProvider({ children }) {
    // Game state
    const [gamesInfo, setGamesInfo] = useState(() => {
        const savedGames = localStorage.getItem('gamesInfo');
        return savedGames ? JSON.parse(savedGames) : [];
    });
    const [sorting, setSorting] = useState({ by: "name", ascending: true });
    const [genreFilters, setGenreFilters] = useState([]);
    const [platformFilters, setPlatformFilters] = useState([]);
    const [searchText, setSearchText] = useState("");
    
    // Company state
    const [companiesInfo, setCompaniesInfo] = useState(() => {
        const savedCompanies = localStorage.getItem('companiesInfo');
        return savedCompanies ? JSON.parse(savedCompanies) : [];
    });
    const [companySorting, setCompanySorting] = useState({ by: "companyName", ascending: true });
    const [companySearchText, setCompanySearchText] = useState("");
    
    // Use a ref to track if the component is mounted
    const isMounted = useRef(true);

    // Save data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('gamesInfo', JSON.stringify(gamesInfo));
    }, [gamesInfo]);
    
    useEffect(() => {
        localStorage.setItem('companiesInfo', JSON.stringify(companiesInfo));
    }, [companiesInfo]);

    // Fetch games with current filtering state
    const fetchGamesWithCurrentState = useCallback(async () => {
        if (!isMounted.current) return;
        
        try {
            console.log(companySearchText);
            const games = await apiService.getAllGames({
                sortBy: sorting.by,
                ascending: sorting.ascending,
                genres: genreFilters,
                platforms: platformFilters,
                searchText: searchText,
                companySearchText: companySearchText
            });
            console.log("Fetched games:", games);

            if (isMounted.current) {
                setGamesInfo(games);
            }
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    }, [sorting, genreFilters, platformFilters, searchText, companySearchText]);
    
    // Fetch companies with current filtering state
    const fetchCompaniesWithCurrentState = useCallback(async () => {
        if (!isMounted.current) return;
        
        try {
            const companies = await apiService.getAllCompanies({
                sortBy: companySorting.by,
                ascending: companySorting.ascending,
                searchText: companySearchText
            });

            if (isMounted.current) {
                setCompaniesInfo([...companies]);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    }, [companySorting, companySearchText]);

    // Effect for data polling
    useEffect(() => {
        isMounted.current = true;
        
        // Initial fetch
        fetchGamesWithCurrentState();
        fetchCompaniesWithCurrentState();
        
        // Set timers for data refresh
        const gameTimeout = setTimeout(fetchGamesWithCurrentState, apiService.INITIAL_REFRESH_TIME);
        const companyTimeout = setTimeout(fetchCompaniesWithCurrentState, apiService.INITIAL_REFRESH_TIME);
        
        const gameInterval = setInterval(fetchGamesWithCurrentState, apiService.POLLING_INTERVAL);
        const companyInterval = setInterval(fetchCompaniesWithCurrentState, apiService.POLLING_INTERVAL);
        
        return () => {
            isMounted.current = false;
            clearTimeout(gameTimeout);
            clearTimeout(companyTimeout);
            clearInterval(gameInterval);
            clearInterval(companyInterval);
        };
    }, [fetchGamesWithCurrentState, fetchCompaniesWithCurrentState]);

    // Game actions
    const deleteGame = useCallback(async (gameId) => {
        try {
            setGamesInfo(prevGames => prevGames.filter(game => game.Id !== gameId));
            await apiService.deleteGame(gameId);
        } catch (error) {
            console.error('Error deleting game:', error);
        }
    }, []);
    
    const modifyGame = useCallback(async (gameData) => {
        try {
            setGamesInfo(prevGames => {
                const index = prevGames.findIndex(game => game.Id === gameData.Id);
                if (index !== -1) {
                    const newGames = [...prevGames];
                    newGames[index] = { ...newGames[index], ...gameData };
                    return newGames;
                } else {
                    return [...prevGames, gameData];
                }
            });
            
            await apiService.modifyGame(gameData);
        } catch (error) {
            console.error('Error modifying game:', error);
        }
    }, []);
    
    // Company actions
    const deleteCompany = useCallback(async (companyId) => {
        try {
            setCompaniesInfo(prevCompanies => prevCompanies.filter(company => company.Id !== companyId));
            await apiService.deleteCompany(companyId);
        } catch (error) {
            console.error('Error deleting company:', error);
        }
    }, []);
    
    const modifyCompany = useCallback(async (companyData) => {
        try {
            setCompaniesInfo(prevCompanies => {
                const index = prevCompanies.findIndex(company => company.Id === companyData.Id);
                if (index !== -1) {
                    const newCompanies = [...prevCompanies];
                    newCompanies[index] = { ...newCompanies[index], ...companyData };
                    return newCompanies;
                } else {
                    return [...prevCompanies, companyData];
                }
            });
            
            await apiService.modifyCompany(companyData);
        } catch (error) {
            console.error('Error modifying company:', error);
        }
    }, []);

    // Shared data and methods
    const sharedData = React.useMemo(() => ({
        // Game-related data and actions
        games: {
            gamesInfo,
            sorting,
            setSorting,
            genreFilters,
            setGenreFilters,
            platformFilters,
            setPlatformFilters,
            searchText,
            setSearchText,
            actions: {
                deleteGame,
                modifyGame,
                setList: setGamesInfo
            }
        },
        
        // Company-related data and actions
        companies: {
            companiesInfo,
            sorting: companySorting,
            setSorting: setCompanySorting,
            searchText: companySearchText,
            setSearchText: setCompanySearchText,
            actions: {
                deleteCompany,
                modifyCompany,
                setList: setCompaniesInfo
            }
        },
        
        // Global constants and utilities
        iconsIDToObjs,
        DEFAULT_PLATFORMS,
        DEFAULT_GENRES,
    }), [
        gamesInfo, sorting, genreFilters, platformFilters, searchText, deleteGame, modifyGame,
        companiesInfo, companySorting, companySearchText, deleteCompany, modifyCompany
    ]);
    
    return (
        <DataContext.Provider value={sharedData}>
            {children}
        </DataContext.Provider>
    );
}

export default DataContext;
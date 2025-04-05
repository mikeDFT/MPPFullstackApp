import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import { iconsIDToObjs } from '@/utils/IconIDs.jsx';
import { UnitTestCRUD } from '@/tests/UnitTestCRUD.jsx';
import { DEFAULT_PLATFORMS, DEFAULT_GENRES } from '@/utils/GenresPlatforms.jsx';
import { apiService } from '@/services/apiService.js';

// Create the context
const GameDataContext = createContext();

// Custom hook to use the game data
export function useGameData() {
	const context = useContext(GameDataContext);
	if (!context) {
		throw new Error('useGameData must be used within a GameDataProvider');
	}
	return context;
}

// Provider component
export function GameDataProvider({ children }) {
	// State declarations
	const [gamesInfo, setGamesInfo] = useState(() => {
		// Load initial state from localStorage
		const savedGames = localStorage.getItem('gamesInfo');
		return savedGames ? JSON.parse(savedGames) : [];
	});
	const [sorting, setSorting] = useState({ by: "name", ascending: true });
	const [genreFilters, setGenreFilters] = useState([]);
	const [platformFilters, setPlatformFilters] = useState([]);
	const [searchText, setSearchText] = useState("");

	// Save gamesInfo to localStorage whenever it changes
	useEffect(() => {
		localStorage.setItem('gamesInfo', JSON.stringify(gamesInfo));
	}, [gamesInfo]);

	// Use useCallback to create a function that updates when dependencies change
	const fetchWithCurrentState = useCallback(async () => {
		try {
			// console.log("Fetching with filters:", {
			// 	sortBy: sorting.by,
			// 	ascending: sorting.ascending,
			// 	genres: genreFilters,
			// 	platforms: platformFilters,
			// 	searchText: searchText
			// });
			
			const games = await apiService.getAllGames({
				sortBy: sorting.by,
				ascending: sorting.ascending,
				genres: genreFilters,
				platforms: platformFilters,
				searchText: searchText
			});

			// Create a new array reference to ensure React detects the change
			setGamesInfo([...games]);
		} catch (error) {
			console.error('Error fetching games:', error);
		}
	}, [sorting, genreFilters, platformFilters, searchText]); // Include all dependencies

	// Effect for polling that uses the callback
	useEffect(() => {
		let isSubscribed = true;
		
		const fetchData = async () => {
			if (!isSubscribed) return;
			await fetchWithCurrentState();
		};

		// Initial fetch
		fetchData();
		
		// Set timeout for initial refresh
		const initialTimeout = setTimeout(fetchData, apiService.INITIAL_REFRESH_TIME);
		
		// Set interval for polling
		const interval = setInterval(fetchData, apiService.POLLING_INTERVAL);
		
		// Cleanup function
		return () => {
			isSubscribed = false;
			clearTimeout(initialTimeout);
			clearInterval(interval);
		};
	}, [fetchWithCurrentState]); // Only depend on the callback

	// Actions that can be performed on the data
	const deleteGame = useCallback(async (gameId) => {
		try {
			// Update local state immediately
			setGamesInfo(prevGames => prevGames.filter(game => game.Id !== gameId));
			
			// Try to update server
			await apiService.deleteGame(gameId);
		} catch (error) {
			console.error('Error deleting game:', error);
			// If server update fails, the local state is already updated
			// and will be persisted to localStorage
		}
	}, []);
	
	const modifyGame = useCallback(async (gameData) => {
		try {
			// Update local state immediately
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
			
			// Try to update server
			await apiService.modifyGame(gameData);
		} catch (error) {
			console.error('Error modifying game:', error);
			// If server update fails, the local state is already updated
			// and will be persisted to localStorage
		}
	}, []);

	// Shared data and methods
	const sharedData = React.useMemo(() => ({
		gamesInfo,
		iconsIDToObjs,
		DEFAULT_PLATFORMS,
		DEFAULT_GENRES,
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
			setGamesInfo,
		}
	}), [
		gamesInfo,
		sorting,
		genreFilters,
		platformFilters,
		searchText,
		deleteGame,
		modifyGame
	]);
	
	return (
		<GameDataContext.Provider value={sharedData}>
			{children}
		</GameDataContext.Provider>
	);
}

export default GameDataContext; 
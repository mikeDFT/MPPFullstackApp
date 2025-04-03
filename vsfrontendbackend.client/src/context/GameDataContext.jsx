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
	const [gamesInfo, setGamesInfo] = useState([]);
	const [sorting, setSorting] = useState({ by: "name", ascending: true });
	const [genreFilters, setGenreFilters] = useState([]);
	const [platformFilters, setPlatformFilters] = useState([]);
	const [searchText, setSearchText] = useState("");

	// Use useCallback to create a function that updates when dependencies change
	const fetchWithCurrentState = useCallback(async () => {
		try {
			console.log("Fetching with filters:", {
				sortBy: sorting.by,
				ascending: sorting.ascending,
				genres: genreFilters,
				platforms: platformFilters,
				searchText: searchText
			});
			
			const games = await apiService.getAllGames({
				sortBy: sorting.by,
				ascending: sorting.ascending,
				genres: genreFilters,
				platforms: platformFilters,
				searchText: searchText
			});

			setGamesInfo(games);
		} catch (error) {
			console.error('Error fetching games:', error);
		}
	}, [sorting, genreFilters, platformFilters, searchText]); // Include dependencies

	// Effect for polling that uses the callback
	useEffect(() => {
		// Initial fetch
		fetchWithCurrentState();
		
		// Set timeout for initial refresh
		const initialTimeout = setTimeout(fetchWithCurrentState, apiService.INITIAL_REFRESH_TIME);
		
		// Set interval for polling
		const interval = setInterval(fetchWithCurrentState, apiService.POLLING_INTERVAL);
		
		// Cleanup function
		return () => {
			clearTimeout(initialTimeout);
			clearInterval(interval);
		};
	}, [fetchWithCurrentState]); // Only depend on the callback

	// Actions that can be performed on the data
	function deleteGame(gameId) {
		apiService.deleteGame(gameId).then(fetchWithCurrentState);
	};
	
	function modifyGame(gameData) {
		apiService.modifyGame(gameData).then(fetchWithCurrentState);
	};

	// Shared data and methods
	const sharedData = {
		gamesInfo,
		iconsIDToObjs,
		DEFAULT_PLATFORMS,
		DEFAULT_GENRES,
		sorting, setSorting,
		genreFilters, setGenreFilters,
		platformFilters, setPlatformFilters,
		searchText, setSearchText,
		
		actions: {
			deleteGame,
			modifyGame,
			setGamesInfo,
		}
	};
	
	return (
		<GameDataContext.Provider value={sharedData}>
			{children}
		</GameDataContext.Provider>
	);
}

export default GameDataContext; 
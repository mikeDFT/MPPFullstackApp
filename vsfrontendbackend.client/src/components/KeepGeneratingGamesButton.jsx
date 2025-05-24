import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { generateGameData } from '../utils/GameDataGenerator';
import { apiService } from '../services/apiService';

export function KeepGeneratingGamesButton() {
	const [isGenerating, setIsGenerating] = useState(false);
	const generationTimerRef = useRef(null);
	const { data, actions } = useData().games;
	const hasInitialized = useRef(false);

	// Set up a function to generate and add a game
	const generateAndAddGame = async () => {
		try {
			// Generate a new game using the local generator
			const newGame = generateGameData(data || []);
			
			// Transform to match the expected API format
			const gameForApi = {
				Id: newGame.ID,
				Name: newGame.Name,
				Price: newGame.Price,
				Description: newGame.Description,
				IconID: newGame.IconID,
				Rating: newGame.Rating,
				Genres: newGame.Genres,
				Platforms: newGame.Platforms,
				CompanyID: Math.floor(Math.random() * 2) + 1, // Random company ID between 1-2
				CompanyName: Math.floor(Math.random() * 2) + 1 === 1 ? "Adventure Studios" : "Cosmic Games"
			};

			console.log('Generated new game:', gameForApi.Name);
			
			// Add to backend via API
			await apiService.modifyGame(gameForApi);
			console.log('Game added to backend:', gameForApi.Name);
			
			// Also update the local context
			if (actions && actions.modifyGame) {
				actions.modifyGame(gameForApi);
				console.log('Game added to context:', gameForApi.Name);
			}
		} catch (error) {
			console.error('Error generating or adding game:', error);
		}
	};

	// Set up the generation interval
	useEffect(() => {
		console.log('KeepGeneratingGamesButton mounted');
		
		// Use a ref to avoid duplicate initialization in React strict mode
		if (hasInitialized.current) {
			console.log('Component already initialized, skipping duplicate init');
			return;
		}
		
		hasInitialized.current = true;
		
		// Clean up function to clear any timers
		return () => {
			if (generationTimerRef.current) {
				clearInterval(generationTimerRef.current);
				generationTimerRef.current = null;
			}
		};
	}, []); // Empty dependency array to run only once

	// Handle changes to isGenerating state
	useEffect(() => {
		if (isGenerating) {
			// Start generating games at regular intervals
			console.log('Starting game generation...');
			
			// Generate one immediately
			generateAndAddGame();
			
			// Set up interval for subsequent generations (every 3 seconds)
			generationTimerRef.current = setInterval(() => {
				generateAndAddGame();
			}, 3000);
		} else {
			// Stop generating games
			if (generationTimerRef.current) {
				console.log('Stopping game generation...');
				clearInterval(generationTimerRef.current);
				generationTimerRef.current = null;
			}
		}
		
		// Clean up on component unmount or when isGenerating changes
		return () => {
			if (generationTimerRef.current) {
				clearInterval(generationTimerRef.current);
				generationTimerRef.current = null;
			}
		};
	}, [isGenerating]);

	const handleClick = () => {
		console.log('Button clicked, toggling generation...');
		setIsGenerating(!isGenerating);
	};

	return (
		<button
			onClick={handleClick}
			style={{
				width: "100%",
				padding: '10px 20px',
				fontSize: '16px',
				cursor: 'pointer',
				backgroundColor: isGenerating ? '#ff4444' : '#4CAF50',
				color: 'white',
				border: 'none',
				borderRadius: '4px',
				transition: 'background-color 0.3s'
			}}
		>
			{isGenerating ? 'Stop Generating' : 'Start Generating'}
		</button>
	);
};

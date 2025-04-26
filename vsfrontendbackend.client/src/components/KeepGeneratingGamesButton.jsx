import React, { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocketService';
import { useData } from '../context/DataContext';

export function KeepGeneratingGamesButton() {
	const [isGenerating, setIsGenerating] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const { actions } = useData().games;
	const hasInitialized = useRef(false);

	// Function to handle reconnection attempts
	const attemptReconnect = useCallback(() => {
		console.log(`Reconnection attempt ${retryCount + 1}`);
		setRetryCount(prev => prev + 1);
		websocketService.connect();
	}, [retryCount]);

	useEffect(() => {
		console.log('KeepGeneratingGamesButton mounted');
		
		// Use a ref to avoid duplicate initialization in React strict mode
		if (hasInitialized.current) {
			console.log('Component already initialized, skipping duplicate init');
			return;
		}
		
		hasInitialized.current = true;
		
		// Register message handlers
		websocketService.registerMessageHandler('newGame', (message) => {
			console.log('New game received:', message);
			// Parse and add the game to the context
			try {
				if (message.data) {
					var newGame = JSON.parse(message.data);
					newGame = { // converting to the expected format
						Id: newGame.id,
						Name: newGame.name,
						Price: newGame.price,
						Description: newGame.description,
						IconID: newGame.iconID,
						Rating: newGame.rating,
						Genres: newGame.genres,
						Platforms: newGame.platforms,
						CompanyID: newGame.companyID,
						CompanyName: newGame.companyName
					  };
					if (newGame && actions && actions.modifyGame) {
						actions.modifyGame(newGame);
						console.log('Game added to context:', newGame.Name);
					}
				}
			} catch (error) {
				console.error('Error processing new game:', error);
			}
		});

		websocketService.registerMessageHandler('started', (message) => {
			console.log('Generation started:', message);
			setIsGenerating(true);
		});

		websocketService.registerMessageHandler('stopped', (message) => {
			console.log('Generation stopped:', message);
			setIsGenerating(false);
		});

		websocketService.registerMessageHandler('pong', (message) => {
			console.log('Received pong from server:', message);
			// Server is alive, connection is working
		});

		// Register connection state change handler
		websocketService.onConnectionChange((connected) => {
			console.log('Connection state changed:', connected);
			setIsConnected(connected);
			
			// Reset retry count when connected
			if (connected) {
				setRetryCount(0);
			}
		});

		// Register generation state change handler
		websocketService.onGenerationStateChange((generating) => {
			console.log('Generation state changed:', generating);
			setIsGenerating(generating);
		});

		// Connect to WebSocket if not already connected or connecting
		// Using a short timeout to avoid multiple connections in development mode
		const connectTimer = setTimeout(() => {
			console.log('Initiating WebSocket connection after delay...');
			websocketService.connect();
		}, 300);
		
		return () => {
			// Only clear the initialization timer, don't disconnect on unmount
			clearTimeout(connectTimer);
		};
	}, []); // Empty dependency array to run only once

	// Add an effect for retry logic - separate from main effect
	useEffect(() => {
		let retryTimeout;
		
		// If not connected and we have retry attempts left, try again after delay
		if (!isConnected && retryCount < 5) {
			retryTimeout = setTimeout(() => {
				attemptReconnect();
			}, 3000 + (retryCount * 1000)); // Increase delay with each retry
		}
		
		return () => {
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}
		};
	}, [isConnected, retryCount, attemptReconnect]);

	const handleClick = () => {
		console.log('Button clicked, toggling generation...');
		if (isConnected) {
			websocketService.toggleGeneration();
		} else {
			// Try to reconnect if disconnected
			websocketService.connect();
		}
	};

	return (
		<button
			onClick={handleClick}
			disabled={!isConnected && retryCount >= 5}
			style={{
				width: "100%",
				padding: '10px 20px',
				fontSize: '16px',
				cursor: isConnected ? 'pointer' : 'not-allowed',
				backgroundColor: isConnected 
					? (isGenerating ? '#ff4444' : '#4CAF50') 
					: (retryCount >= 5 ? '#999999' : '#cccccc'),
				color: 'white',
				border: 'none',
				borderRadius: '4px',
				transition: 'background-color 0.3s'
			}}
		>
			{!isConnected 
				? (retryCount >= 5 ? 'Connection Failed' : `Connecting... (${retryCount})`) 
				: (isGenerating ? 'Stop Generating' : 'Start Generating')}
		</button>
	);
};

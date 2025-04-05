import React, { useState, useEffect, useCallback } from 'react';
import websocketService from '../services/websocketService';
import { useGameData } from '../context/GameDataContext';

export function KeepGeneratingGamesButton() {
	const [isGenerating, setIsGenerating] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const { actions } = useGameData();

	// Function to handle reconnection attempts
	const attemptReconnect = useCallback(() => {
		console.log(`Reconnection attempt ${retryCount + 1}`);
		setRetryCount(prev => prev + 1);
		websocketService.connect();
	}, [retryCount]);

	useEffect(() => {
		console.log('KeepGeneratingGamesButton mounted');
		
		// Register message handlers
		websocketService.registerMessageHandler('newGame', (message) => {
			console.log('New game received:', message);
			// Parse and add the game to the context
			try {
				if (message.data) {
					const newGame = JSON.parse(message.data);
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

		// Connect to WebSocket if not already connected
		if (!websocketService.getConnectionState()) {
			console.log('Initiating WebSocket connection...');
			websocketService.connect();
		}

		// Cleanup function
		return () => {
			console.log('KeepGeneratingGamesButton unmounting, cleaning up...');
			// Don't close the connection here, let the service handle it
		};
	}, [actions, attemptReconnect]);

	// Add an effect for retry logic
	useEffect(() => {
		// If not connected and we have retry attempts left, try again after delay
		if (!isConnected && retryCount < 5) {
			const retryTimeout = setTimeout(() => {
				attemptReconnect();
			}, 3000 + (retryCount * 1000)); // Increase delay with each retry
			
			return () => clearTimeout(retryTimeout);
		}
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

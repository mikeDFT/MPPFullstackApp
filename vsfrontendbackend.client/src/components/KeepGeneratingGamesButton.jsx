import React, {useRef, useState, useEffect} from "react";
import {useGameData} from "@/context/GameDataContext.jsx";


export function KeepGeneratingGamesButton() {
	const { actions } = useGameData();
	const [isGenerating, setIsGenerating] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const wsRef = useRef(null);
	const reconnectTimeoutRef = useRef(null);

	// Connect to WebSocket when component mounts
	useEffect(() => {
		connectWebSocket();
		
		// Cleanup on unmount
		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		};
	});

	// Handle WebSocket connection
	const connectWebSocket = () => {
		// Close existing connection if any
		if (wsRef.current) {
			wsRef.current.close();
		}

		// Create new WebSocket connection
		// The server is running on https://localhost:7299
		// For WebSocket, we need to use wss:// for secure connections
		const wsUrl = 'wss://localhost:7299/api/GeneratingGames/ws';
		console.log('Connecting to WebSocket:', wsUrl);
		
		const ws = new WebSocket(wsUrl);
		wsRef.current = ws;

		// Set up event handlers
		ws.onopen = () => {
			console.log('WebSocket connected');
			setIsConnected(true);
			
			// If we were generating before reconnect, restart generation
			if (isGenerating) {
				sendCommand('start');
			}
		};

		ws.onclose = (event) => {
			console.log('WebSocket disconnected', event.code, event.reason);
			setIsConnected(false);
			
			// Attempt to reconnect after a delay
			reconnectTimeoutRef.current = setTimeout(() => {
				connectWebSocket();
			}, 3000);
		};

		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		ws.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				console.log('Received message:', message);
				
				switch (message.action) {
					case 'newGame':
						// Add the new game to the context
						var newGame = JSON.parse(message.data);
						actions.modifyGame(newGame);
						break;
					case 'started':
						console.log('Game generation started');
						break;
					case 'stopped':
						console.log('Game generation stopped');
						setIsGenerating(false);
						break;
					default:
						console.log('Unknown message:', message);
				}
			} catch (error) {
				console.error('Error processing WebSocket message:', error);
			}
		};
	};

	// Send a command to the WebSocket server
	const sendCommand = (action) => {
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			const command = {
				action: action,
				data: ''
			};
			console.log('Sending command:', command);
			wsRef.current.send(JSON.stringify(command));
		} else {
			console.error('WebSocket is not connected');
		}
	};

	// Function to generate a batch of games
	const generateMoreGames = () => {
		if (isGenerating) {
			// Stop generating
			sendCommand('stop');
			setIsGenerating(false);
		} else {
			// Start generating
			sendCommand('start');
			setIsGenerating(true);
		}
	};

	return (
		<button
			style={{
				width: "100%", 
				backgroundColor: isGenerating ? "#8B0000" : "#650173", 
				color: "#FFFFFF", 
				borderRadius: "0.5em", 
				padding: "0.5em", 
				fontSize: "1em",
				opacity: isConnected ? 1 : 0.5
			}}
			onClick={generateMoreGames}
			disabled={!isConnected}
		>
			{isGenerating ? 'Stop generating' : 'Start generating'}
			{!isConnected && ' (Connecting...)'}
		</button>
	);
}


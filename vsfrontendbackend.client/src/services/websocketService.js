// Add a static instance tracking for dev mode detection
let instanceCounter = 0;

// Import configuration
import { SERVER_IP, SERVER_HTTPS_PORT, WSS_URL } from '../config';

// WebSocket service to handle all WebSocket connections and logic
class WebSocketService {
	constructor() {
		this.instanceId = ++instanceCounter;
		console.log(`Creating WebSocketService instance #${this.instanceId}`);
		
		this.ws = null;
		this.isConnected = false;
		this.isGenerating = false;
		this.reconnectTimeout = null;
		this.reconnectAttempts = 0;
		this.messageHandlers = new Map();
		this.connectionChangeCallbacks = [];
		this.generationStateChangeCallbacks = [];
		this.connectionId = null;
		this.pingInterval = null;
		this.isConnecting = false; // flag to prevent multiple connect attempts
		this.connectionDebounceTimeout = null; // debounce repeated connection attempts
		this.lastConnectionAttemptTime = 0; // track last connection attempt time
	}

	// Initialize the WebSocket connection
	connect() {
		// Don't try to connect if already connecting
		if (this.isConnecting) {
			console.log('Already attempting to connect, ignoring request');
			return;
		}
		
		// Debounce connection attempts (minimum 2 seconds between attempts)
		const now = Date.now();
		if (now - this.lastConnectionAttemptTime < 2000) {
			console.log('Connection attempt too soon after previous attempt, debouncing');
			clearTimeout(this.connectionDebounceTimeout);
			this.connectionDebounceTimeout = setTimeout(() => {
				this.connect();
			}, 2000);
			return;
		}
		
		this.lastConnectionAttemptTime = now;
		
		// Close existing connection if any
		this.closeConnection();
		
		this.isConnecting = true;

		try {
			// Create new WebSocket connection
			// The server is running on the configured IP and port
			// Use the same protocol as the current page (ws or wss)
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			const wsUrl = `${protocol}//${SERVER_IP}:${SERVER_HTTPS_PORT}/api/GeneratingGames/ws`;
			console.log('Connecting to WebSocket:', wsUrl);
			
			this.ws = new WebSocket(wsUrl);
			const ws = this.ws;
			
			// Add a connection timeout to prevent hanging indefinitely
			const connectionTimeout = setTimeout(() => {
				if (ws && ws.readyState !== WebSocket.OPEN) {
					console.error('WebSocket connection timeout');
					// Use specific close code to indicate timeout
					this._closeSocket(ws, 1001, 'Connection timeout');
					this.isConnecting = false;
				}
			}, 10000); // 10 second timeout

			// Set up event handlers
			ws.onopen = () => {
				this.isConnected = true;
				this.isConnecting = false;
				console.log('WebSocket connected successfully');
				clearTimeout(connectionTimeout); // Clear the timeout on successful connection
				this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
				this.notifyConnectionChange();
				
				// Send a ping message to keep the connection alive
				this.sendPing();
				
				// If we were generating before reconnect, restart generation
				if (this.isGenerating) {
					this.sendCommand('start');
				}
			};

			ws.onclose = (event) => {
				console.log('WebSocket disconnected', event.code, event.reason);
				clearTimeout(connectionTimeout); // Clear timeout if socket closed
				
				// Only set these if this is the current socket
				if (this.ws === ws) {
					this.isConnected = false;
					this.isConnecting = false;
					this.ws = null;
					this.notifyConnectionChange();
					
					// Only attempt to reconnect if the close wasn't initiated by us
					// and we don't have too many attempts
					if (event.code !== 1000 && event.code !== 1001 && this.reconnectAttempts < 5) {
						this.reconnectAttempts++;
						console.log(`Reconnect attempt ${this.reconnectAttempts}`);
						
						// Attempt to reconnect after a delay
						clearTimeout(this.reconnectTimeout);
						this.reconnectTimeout = setTimeout(() => {
							console.log('Attempting to reconnect...');
							this.connect();
						}, 3000 + (this.reconnectAttempts * 1000)); // Increase delay with each retry
					}
				}
			};

			ws.onerror = (error) => {
				console.error('WebSocket error encountered:', error);
				if (error.message) {
					console.error('Error message:', error.message);
				}
				if (error.type) {
					console.error('Error type:', error.type);
				}
				
				// Do not close the connection here, let onclose handle it
				if (this.ws === ws) {
					this.isConnecting = false;
				}
			};

			ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data);
					console.log('Received message:', message);
					
					// Call the appropriate handler for this message type
					const handler = this.messageHandlers.get(message.action);
					if (handler) {
						handler(message);
					} else {
						console.log('No handler for message type:', message.action);
					}
				} catch (error) {
					console.error('Error processing WebSocket message:', error);
				}
			};
		} catch (error) {
			console.error('Error creating WebSocket connection:', error);
			this.isConnecting = false;
			// Try to reconnect after a delay
			this.reconnectAttempts++;
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = setTimeout(() => {
				console.log('Attempting to reconnect after error...');
				this.connect();
			}, 3000 + (this.reconnectAttempts * 1000));
		}
	}

	// Helper method to safely close a socket
	_closeSocket(socket, code = 1000, reason = 'Client closing connection') {
		if (!socket) return;
		
		try {
			socket.close(code, reason); // close anyway to not queue requests
		} catch (e) {
			console.error('Error closing WebSocket:', e);
		}
	}

	// Send a ping message to keep the connection alive
	sendPing() {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			const pingCommand = {
				action: "ping",
				data: ""
			};
			try {
				this.ws.send(JSON.stringify(pingCommand));
				console.log('Sent ping to server');
				
				// Set up a heartbeat interval
				if (this.pingInterval) {
					clearInterval(this.pingInterval);
				}
				
				this.pingInterval = setInterval(() => {
					if (this.ws && this.ws.readyState === WebSocket.OPEN) {
						this.ws.send(JSON.stringify(pingCommand));
						console.log('Sent heartbeat ping');
					} else {
						console.log('Cannot send ping - connection not open');
						clearInterval(this.pingInterval);
						this.pingInterval = null;
					}
				}, 30000); // Send ping every 30 seconds
			} catch (error) {
				console.error('Error sending ping:', error);
			}
		}
	}

	// Properly close the WebSocket connection
	closeConnection() {
		// Clear ping interval
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
		
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
		
		if (this.connectionDebounceTimeout) {
			clearTimeout(this.connectionDebounceTimeout);
			this.connectionDebounceTimeout = null;
		}
		
		// Store reference to current socket to avoid race conditions
		const currentSocket = this.ws;
		if (currentSocket) {
			// Clear the reference first to prevent onclose handler from attempting reconnect
			this.ws = null;
			this._closeSocket(currentSocket);
		}
	}

	// Send a command to the WebSocket server
	sendCommand(action) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			const command = {
				action: action,
				data: ''
			};
			console.log('Sending command:', command);
			try {
				this.ws.send(JSON.stringify(command));
			} catch (error) {
				console.error('Error sending command:', error);
				// If there's an error sending, try to reconnect
				this.isConnected = false;
				this.notifyConnectionChange();
				this.reconnectAttempts++;
				this.reconnectTimeout = setTimeout(() => {
					console.log('Attempting to reconnect after send error...');
					this.connect();
				}, 3000);
			}
		} else {
			console.error('WebSocket is not connected');
			// Try to reconnect
			this.reconnectAttempts++;
			this.reconnectTimeout = setTimeout(() => {
				console.log('Attempting to reconnect after not connected...');
				this.connect();
			}, 3000);
		}
	}

	// Start or stop generating games
	toggleGeneration() {
		if (this.isGenerating) {
			// Stop generating
			this.sendCommand('stop');
			this.isGenerating = false;
		} else {
			// Start generating
			this.sendCommand('start');
			this.isGenerating = true;
		}
		this.notifyGenerationStateChange();
	}

	// Register a handler for a specific message type
	registerMessageHandler(action, handler) {
		this.messageHandlers.set(action, handler);
	}

	// Register a callback for connection state changes
	onConnectionChange(callback) {
		this.connectionChangeCallbacks.push(callback);
		// Call immediately with current state
		callback(this.isConnected);
	}

	// Register a callback for generation state changes
	onGenerationStateChange(callback) {
		this.generationStateChangeCallbacks.push(callback);
		// Call immediately with current state
		callback(this.isGenerating);
	}

	// Notify all connection change callbacks
	notifyConnectionChange() {
		this.connectionChangeCallbacks.forEach(callback => callback(this.isConnected));
	}

	// Notify all generation state change callbacks
	notifyGenerationStateChange() {
		this.generationStateChangeCallbacks.forEach(callback => callback(this.isGenerating));
	}

	// Get the current connection state
	getConnectionState() {
		return this.isConnected;
	}

	// Get the current generation state
	getGenerationState() {
		return this.isGenerating;
	}

	// Clean up all resources - should be called when application unmounts
	cleanup() {
		console.log(`Cleaning up WebSocketService instance #${this.instanceId}`);
		this.closeConnection();
		
		// Clear all handlers and callbacks
		this.messageHandlers.clear();
		this.connectionChangeCallbacks = [];
		this.generationStateChangeCallbacks = [];
	}
}

// Create a singleton instance
const websocketService = new WebSocketService();

// In development mode with React StrictMode, ensure we clean up on page reload/close
if (process.env.NODE_ENV === 'development') {
	window.addEventListener('beforeunload', () => {
		console.log('Page unloading, cleaning up WebSocketService');
		websocketService.cleanup();
	});
}

// Export the singleton instance
export default websocketService;

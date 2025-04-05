// WebSocket service to handle all WebSocket connections and logic
class WebSocketService {
    constructor() {
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
    }

    // Initialize the WebSocket connection
    connect() {
        // Close existing connection if any
        this.closeConnection();

        // Create new WebSocket connection
        // The server is running on https://localhost:7299
        const serverUrl = 'localhost:7299';
        const wsUrl = `wss://${serverUrl}/api/GeneratingGames/ws`;
        console.log('Connecting to WebSocket:', wsUrl);
        
        try {
            const ws = new WebSocket(wsUrl);
            this.ws = ws;
            
            // Add a connection timeout to prevent hanging indefinitely
            const connectionTimeout = setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    console.error('WebSocket connection timeout');
                    ws.close();
                }
            }, 10000); // 10 second timeout

            // Set up event handlers
            ws.onopen = () => {
                console.log('WebSocket connected successfully');
                clearTimeout(connectionTimeout); // Clear the timeout on successful connection
                this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
                this.isConnected = true;
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
                this.isConnected = false;
                this.notifyConnectionChange();
                
                // Only attempt to reconnect if the close wasn't initiated by us
                if (event.code !== 1000) {
                    this.reconnectAttempts++;
                    console.log(`Reconnect attempt ${this.reconnectAttempts}`);
                    
                    // Attempt to reconnect after a delay
                    this.reconnectTimeout = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        this.connect();
                    }, 3000);
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
                // Note: Specific error codes/reasons are usually found in the onclose event.
                // The onerror event often just indicates a generic network error.
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
            // Try to reconnect after a delay
            this.reconnectAttempts++;
            this.reconnectTimeout = setTimeout(() => {
                console.log('Attempting to reconnect after error...');
                this.connect();
            }, 3000);
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
                this.pingInterval = setInterval(() => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify(pingCommand));
                        console.log('Sent heartbeat ping');
                    } else {
                        console.log('Cannot send ping - connection not open');
                        clearInterval(this.pingInterval);
                    }
                }, 30000); // Send ping every 30 seconds
            } catch (error) {
                console.error('Error sending ping:', error);
            }
        }
    }

    // Properly close the WebSocket connection
    closeConnection() {
        if (this.ws) {
            // Only close if not already closing or closed
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                console.log('Properly closing WebSocket connection');
                this.ws.close(1000, 'Component unmounting');
            }
            this.ws = null;
        }
        
        // Clear ping interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
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
}

// Create a singleton instance
const websocketService = new WebSocketService();

// Export the singleton instance
export default websocketService;

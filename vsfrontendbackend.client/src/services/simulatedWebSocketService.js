// Offline WebSocket Service
// This provides WebSocket functionality for offline/local mode

import localBackend from './simulatedBackend.js';

class OfflineWebSocketService {
    constructor() {
        this.isConnected = false;
        this.isGenerating = false;
        this.messageHandlers = new Map();
        this.connectionChangeCallbacks = [];
        this.generationStateChangeCallbacks = [];
        this.generationInterval = null;
        this.connectionId = null;
        this.pingInterval = null;
        
        // Connection configuration
        this.connectionDelay = 100; // ms
        this.messageDelay = 50; // ms
        this.generationInterval = 2000; // Generate a game every 2 seconds
    }

    // Initialize the WebSocket connection
    async connect() {
        console.log('WebSocket: Attempting to connect...');
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, this.connectionDelay));
        
        this.isConnected = true;
        this.connectionId = 'offline-' + Date.now();
        
        console.log('WebSocket: Connected successfully');
        this.notifyConnectionChange();
        
        // Start ping interval to simulate keep-alive
        this.startPingInterval();
        
        // Send connection confirmation
        setTimeout(() => {
            this.simulateMessage({
                action: 'connected',
                data: JSON.stringify({
                    connectionId: this.connectionId,
                    message: 'Successfully connected to WebSocket'
                })
            });
        }, this.messageDelay);
        
        return true;
    }    // Close the connection
    disconnect() {
        console.log('WebSocket: Disconnecting...');
        
        this.stopGeneration();
        this.stopPingInterval();
        
        this.isConnected = false;
        this.connectionId = null;
        
        console.log('WebSocket: Disconnected');
        this.notifyConnectionChange();
    }    // Send a command to the server
    async sendCommand(action, data = '') {
        if (!this.isConnected) {
            console.warn('WebSocket: Cannot send command, not connected');
            return false;
        }

        console.log(`WebSocket: Sending command: ${action}`);
        
        // Simulate message processing delay
        await new Promise(resolve => setTimeout(resolve, this.messageDelay));
        
        switch (action.toLowerCase()) {
            case 'start':
                await this.handleStartCommand();
                break;
            case 'stop':
                await this.handleStopCommand();
                break;
            case 'ping':
                await this.handlePingCommand();
                break;            default:
                console.warn(`WebSocket: Unknown command: ${action}`);
                this.simulateMessage({
                    action: 'error',
                    data: JSON.stringify({
                        error: `Unknown command: ${action}`,
                        timestamp: new Date().toISOString()
                    })
                });
        }
        
        return true;
    }

    // Handle start generation command
    async handleStartCommand() {
        if (this.isGenerating) {
            console.log('WebSocket: Generation already running');
            return;
        }

        this.isGenerating = true;
        this.notifyGenerationStateChange();
        
        // Send start confirmation
        this.simulateMessage({
            action: 'start',
            data: JSON.stringify({
                message: 'Game generation started',
                timestamp: new Date().toISOString()
            })
        });

        // Start generation loop
        this.startGenerationLoop();
    }

    // Handle stop generation command
    async handleStopCommand() {
        if (!this.isGenerating) {
            console.log('WebSocket: Generation not running');
            return;
        }

        this.stopGeneration();
        
        // Send stop confirmation
        this.simulateMessage({
            action: 'stop',
            data: JSON.stringify({
                message: 'Game generation stopped',
                timestamp: new Date().toISOString()
            })
        });
    }

    // Handle ping command
    async handlePingCommand() {
        this.simulateMessage({
            action: 'pong',
            data: JSON.stringify({
                message: 'Server is alive',
                timestamp: new Date().toISOString(),
                connectionId: this.connectionId
            })
        });
    }

    // Start the game generation loop
    startGenerationLoop() {
        if (this.generationInterval) {
            clearInterval(this.generationInterval);
        }

        this.generationInterval = setInterval(() => {
            if (this.isGenerating && this.isConnected) {
                this.generateAndSendGame();
            }
        }, this.generationInterval);
        
        console.log('WebSocket: Started generation loop');
    }

    // Stop game generation
    stopGeneration() {
        this.isGenerating = false;
        this.notifyGenerationStateChange();
        
        if (this.generationInterval) {
            clearInterval(this.generationInterval);
            this.generationInterval = null;
        }
        
        console.log('WebSocket: Stopped generation');
    }

    // Generate and send a new game
    generateAndSendGame() {
        try {
            // Generate a new game using the simulated backend
            const newGame = localBackend.games.generateRandomGame();
            
            // Convert to DTO format for consistency with real server
            const gameDto = {
                id: newGame.Id,
                name: newGame.Name,
                price: newGame.Price,
                description: newGame.Description,
                iconID: newGame.IconID,
                rating: newGame.Rating,
                genres: newGame.Genres,
                platforms: newGame.Platforms,
                companyID: newGame.CompanyID,
                companyName: newGame.CompanyName || ""
            };
            
            // Send the new game to clients
            this.simulateMessage({
                action: 'newGame',
                data: JSON.stringify(gameDto)
            });
            
            console.log(`WebSocket: Generated and sent game: ${newGame.Name}`);
        } catch (error) {
            console.error('WebSocket: Error generating game:', error);
            
            this.simulateMessage({
                action: 'error',
                data: JSON.stringify({
                    error: 'Failed to generate game',
                    details: error.message,
                    timestamp: new Date().toISOString()
                })
            });
        }
    }

    // Start ping interval
    startPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        // Send ping every 30 seconds to simulate keep-alive
        this.pingInterval = setInterval(() => {
            if (this.isConnected) {
                this.simulateMessage({
                    action: 'ping',
                    data: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        connectionId: this.connectionId
                    })
                });
            }
        }, 30000);
    }

    // Stop ping interval
    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    // Simulate receiving a message from the server
    simulateMessage(message) {
        // Add small delay to simulate network latency
        setTimeout(() => {
            const handler = this.messageHandlers.get(message.action);
            if (handler) {
                try {
                    handler(message);
                } catch (error) {
                    console.error(`WebSocket: Error in message handler for ${message.action}:`, error);
                }
            } else {
                console.log(`WebSocket: No handler for message action: ${message.action}`);
            }
        }, Math.random() * 20 + 10); // 10-30ms delay
    }

    // Add message handler
    addMessageHandler(action, handler) {
        this.messageHandlers.set(action, handler);
    }

    // Remove message handler
    removeMessageHandler(action) {
        this.messageHandlers.delete(action);
    }

    // Add connection change callback
    addConnectionChangeCallback(callback) {
        this.connectionChangeCallbacks.push(callback);
    }

    // Remove connection change callback
    removeConnectionChangeCallback(callback) {
        const index = this.connectionChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.connectionChangeCallbacks.splice(index, 1);
        }
    }

    // Add generation state change callback
    addGenerationStateChangeCallback(callback) {
        this.generationStateChangeCallbacks.push(callback);
    }

    // Remove generation state change callback
    removeGenerationStateChangeCallback(callback) {
        const index = this.generationStateChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.generationStateChangeCallbacks.splice(index, 1);
        }
    }

    // Notify connection change
    notifyConnectionChange() {
        this.connectionChangeCallbacks.forEach(callback => {
            try {
                callback(this.isConnected);
            } catch (error) {
                console.error('WebSocket: Error in connection change callback:', error);
            }
        });
    }

    // Notify generation state change
    notifyGenerationStateChange() {
        this.generationStateChangeCallbacks.forEach(callback => {
            try {
                callback(this.isGenerating);
            } catch (error) {
                console.error('WebSocket: Error in generation state change callback:', error);
            }
        });
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isGenerating: this.isGenerating,
            connectionId: this.connectionId
        };
    }

    // Simulate connection issues (for testing)
    simulateConnectionLoss() {
        if (this.isConnected) {
            console.log('WebSocket: Simulating connection loss...');
            this.disconnect();
            
            // Auto-reconnect after a delay (simulate reconnection logic)
            setTimeout(() => {
                console.log('WebSocket: Auto-reconnecting...');
                this.connect();
            }, 3000);
        }
    }

    // Simulate server error
    simulateServerError(message = 'Simulated server error') {
        this.simulateMessage({
            action: 'error',
            data: JSON.stringify({
                error: message,
                timestamp: new Date().toISOString(),
                connectionId: this.connectionId
            })
        });
    }
}

// Create singleton instance
const offlineWebSocketService = new OfflineWebSocketService();

export default OfflineWebSocketService;
export { offlineWebSocketService };

// Configuration for simulation mode
// This allows switching between real server and simulated backend

class SimulationConfig {    constructor() {
        // Default to simulation mode on by default
        this.simulationMode = this.getStoredPreference();
        this.forceSimulation = false; // Can be set to always use simulation
        this.callbacks = new Set();
    }// Get stored preference from localStorage
    getStoredPreference() {
        try {
            const stored = localStorage.getItem('simulationMode');
            return stored ? JSON.parse(stored) : true; // Default to true (simulation mode on)
        } catch (error) {
            console.warn('Error reading simulation mode preference:', error);
            return true; // Default to true on error
        }
    }

    // Store preference in localStorage
    storePreference(enabled) {
        try {
            localStorage.setItem('simulationMode', JSON.stringify(enabled));
        } catch (error) {
            console.warn('Error storing simulation mode preference:', error);
        }
    }

    // Check if simulation mode should be used
    isSimulationMode() {
        return this.forceSimulation || this.simulationMode;
    }

    // Enable simulation mode
    enableSimulation() {
        this.simulationMode = true;
        this.storePreference(true);
        this.notifyCallbacks();
    }

    // Disable simulation mode (use real server)
    disableSimulation() {
        this.simulationMode = false;
        this.storePreference(false);
        this.notifyCallbacks();
    }

    // Toggle simulation mode
    toggle() {
        if (this.simulationMode) {
            this.disableSimulation();
        } else {
            this.enableSimulation();
        }
        return this.simulationMode;
    }

    // Subscribe to simulation mode changes
    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    // Notify all subscribers of changes
    notifyCallbacks() {
        this.callbacks.forEach(callback => {
            try {
                callback(this.isSimulationMode());
            } catch (error) {
                console.error('Error in simulation mode callback:', error);
            }
        });
    }

    // Get current status for debugging
    getStatus() {
        return {
            simulationMode: this.simulationMode,
            forceSimulation: this.forceSimulation,
            isActive: this.isSimulationMode(),
            callbackCount: this.callbacks.size
        };
    }
}

// Create singleton instance
const simulationConfig = new SimulationConfig();

export default simulationConfig;

// Convenience exports
export const isSimulationMode = () => simulationConfig.isSimulationMode();
export const enableSimulation = () => simulationConfig.enableSimulation();
export const disableSimulation = () => simulationConfig.disableSimulation();
export const toggleSimulation = () => simulationConfig.toggle();
export const subscribeToSimulationChanges = (callback) => simulationConfig.subscribe(callback);

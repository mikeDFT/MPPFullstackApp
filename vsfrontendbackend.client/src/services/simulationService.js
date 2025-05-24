import simulationConfig from '../config/simulationConfig';

// Central service for server simulation
class SimulationService {
  constructor() {
    this.isSimulationMode = simulationConfig.isSimulationMode();
    
    // Subscribe to simulation mode changes
    simulationConfig.subscribe((isSimulation) => {
      console.log(`Simulation mode changed: ${isSimulation}`);
      this.isSimulationMode = isSimulation;
    });
  }
  
  // Check if simulation mode is active
  isSimulation() {
    return this.isSimulationMode;
  }
}

// Create a singleton instance
const simulationService = new SimulationService();

export default simulationService;

import React, { useState, useEffect } from 'react';
import { 
    simulationConfig, 
    enableSimulationMode, 
    disableSimulationMode, 
    isSimulationModeActive 
} from '../services/apiService';
import '../css/SimulationControl.css';

const SimulationControl = () => {
    const [isSimulationActive, setIsSimulationActive] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Initialize state
        setIsSimulationActive(isSimulationModeActive());

        // Subscribe to simulation mode changes
        const unsubscribe = simulationConfig.subscribe((isActive) => {
            setIsSimulationActive(isActive);
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    const handleToggle = () => {
        if (isSimulationActive) {
            disableSimulationMode();
        } else {
            enableSimulationMode();
        }
    };

    const getStatusInfo = () => {
        return simulationConfig.getStatus();
    };

    return (
        <div className="simulation-control">
            <div className="simulation-toggle">
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={isSimulationActive}
                        onChange={handleToggle}
                        className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">
                        {isSimulationActive ? 'Simulation Mode' : 'Server Mode'}
                    </span>
                </label>
            </div>

            <div className="simulation-status">
                <span className={`status-indicator ${isSimulationActive ? 'simulation' : 'server'}`}>
                    {isSimulationActive ? '🔧' : '🌐'}
                </span>
                <span className="status-text">
                    {isSimulationActive 
                        ? 'Using simulated backend' 
                        : 'Using real server'}
                </span>
            </div>

            <button 
                className="details-button"
                onClick={() => setShowDetails(!showDetails)}
                title="Show simulation details"
            >
                ℹ️
            </button>

            {showDetails && (
                <div className="simulation-details">
                    <h4>Simulation Status</h4>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Mode:</span>
                            <span className="detail-value">
                                {isSimulationActive ? 'Simulation' : 'Real Server'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Data Source:</span>
                            <span className="detail-value">
                                {isSimulationActive ? 'In-memory storage' : 'Server database'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">WebSocket:</span>
                            <span className="detail-value">
                                {isSimulationActive ? 'Simulated' : 'Real connection'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Features:</span>
                            <span className="detail-value">
                                {isSimulationActive 
                                    ? 'All API operations, file handling, real-time games' 
                                    : 'Full server functionality'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="simulation-benefits">
                        <h5>Simulation Mode Benefits:</h5>
                        <ul>
                            <li>✅ Works offline</li>
                            <li>✅ No server dependency</li>
                            <li>✅ Consistent test data</li>
                            <li>✅ Instant responses</li>
                            <li>✅ All CRUD operations</li>
                            <li>✅ Real-time game generation</li>
                            <li>✅ File upload/download simulation</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimulationControl;

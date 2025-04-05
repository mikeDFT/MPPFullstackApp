import React from "react";
import "../css/NetworkStatusIndicator.css";
import { serverStatus, checkServerStatus } from "../services/apiService";
import { useNavigatorOnLine } from "../utils/OnlineChecker"

export function StatusIndicator() {
    const isOnline = useNavigatorOnLine();
    const [isServerUp, setIsServerUp] = React.useState(true);
    const [isVisible, setIsVisible] = React.useState(false);
    const [statusType, setStatusType] = React.useState('online'); // 'online', 'offline', 'server-down'

    React.useEffect(() => {
        // Subscribe to server status updates
        const unsubscribe = serverStatus.subscribe(setIsServerUp);

        // Initial server status check
        checkServerStatus();

        // Set up periodic server status checks
        const intervalId = setInterval(checkServerStatus, 30000); // Check every 30 seconds

        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, []);

    React.useEffect(() => {
        if (!isOnline) {
            setIsVisible(true);
            setStatusType('offline');
        } else if (!isServerUp) {
            setIsVisible(true);
            setStatusType('server-down');
        } else {
            setStatusType('online');
            // Add a small delay before hiding to show the "back online" message
            const timeoutId = setTimeout(() => {
                setIsVisible(false);
            }, 2000);
            return () => clearTimeout(timeoutId);
        }
    }, [isOnline, isServerUp]);

    const getStatusMessage = () => {
        switch (statusType) {
            case 'offline':
                return 'You are Offline';
            case 'server-down':
                return 'Server is Down';
            default:
                return 'Back Online';
        }
    };

    const getStatusIcon = () => {
        switch (statusType) {
            case 'offline':
                return '⚠';
            case 'server-down':
                return '🔴';
            default:
                return '✓';
        }
    };

    return (
        <div className={`network-status ${isVisible ? 'visible' : ''} ${statusType}`}>
            <div className="status-content">
                <span className="status-icon">
                    {getStatusIcon()}
                </span>
                <span className="status-text">
                    {getStatusMessage()}
                </span>
            </div>
        </div>
    );
}
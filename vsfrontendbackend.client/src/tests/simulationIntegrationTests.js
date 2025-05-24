// Test file to verify simulation integration
import { apiService, enableSimulationMode, disableSimulationMode, isSimulationModeActive } from '../services/apiService';
import websocketService from '../services/websocketService';

export const runSimulationTests = async () => {
    console.log('🧪 Starting simulation integration tests...');
    
    try {
        // Test 1: Check initial simulation state
        console.log('📝 Test 1: Check initial simulation state');
        const initialState = isSimulationModeActive();
        console.log(`Initial simulation mode: ${initialState}`);
        
        // Test 2: Enable simulation mode
        console.log('📝 Test 2: Enable simulation mode');
        enableSimulationMode();
        const simulationEnabled = isSimulationModeActive();
        console.log(`Simulation mode enabled: ${simulationEnabled}`);
        
        // Test 3: Test API service with simulation
        console.log('📝 Test 3: Test API service with simulation');
        const testParams = {
            sortBy: 'name',
            ascending: true,
            searchText: '',
            companySearchText: '',
            genres: [],
            platforms: []
        };
        
        const games = await apiService.getAllGames(testParams);
        console.log(`✅ Retrieved ${games.length} games from simulated backend`);
        
        if (games.length > 0) {
            const firstGame = games[0];
            console.log(`First game: ${firstGame.Name} by ${firstGame.CompanyName}`);
            
            // Test get single game
            const singleGame = await apiService.getGame(firstGame.Id);
            console.log(`✅ Retrieved single game: ${singleGame.Name}`);
        }
        
        // Test 4: Test company API
        console.log('📝 Test 4: Test company API');
        const companies = await apiService.getAllCompanies({
            sortBy: 'name',
            ascending: true,
            searchText: ''
        });
        console.log(`✅ Retrieved ${companies.length} companies from simulated backend`);
        
        // Test 5: Test rating distribution
        console.log('📝 Test 5: Test rating distribution');
        const ratingDistribution = await apiService.getRatingDistribution();
        console.log('✅ Rating distribution:', ratingDistribution);
        
        // Test 6: Test file operations
        console.log('📝 Test 6: Test file operations');
        const fileExists = await apiService.checkFileExists();
        console.log(`✅ File exists check: ${fileExists}`);
        
        // Test 7: Test WebSocket simulation
        console.log('📝 Test 7: Test WebSocket simulation');
        console.log(`WebSocket connection state: ${websocketService.getConnectionState()}`);
        console.log(`WebSocket generation state: ${websocketService.getGenerationState()}`);
        
        // Test 8: Disable simulation mode
        console.log('📝 Test 8: Disable simulation mode');
        disableSimulationMode();
        const simulationDisabled = !isSimulationModeActive();
        console.log(`Simulation mode disabled: ${simulationDisabled}`);
        
        console.log('✅ All simulation integration tests completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Simulation tests failed:', error);
        return false;
    }
};

export const testCRUDOperations = async () => {
    console.log('🧪 Testing CRUD operations with simulation...');
    
    try {
        // Enable simulation mode
        enableSimulationMode();
        
        // Test creating a new game
        const newGame = {
            Name: 'Test Game',
            Price: 29.99,
            Description: 'A test game for simulation',
            IconID: 'test-icon',
            Rating: 4.5,
            Genres: ['Action', 'Adventure'],
            Platforms: ['PC', 'PlayStation'],
            CompanyID: 1
        };
        
        console.log('📝 Creating new game...');
        const createdGame = await apiService.modifyGame(newGame);
        console.log('✅ Game created:', createdGame);
        
        // Test updating the game
        const updatedGame = {
            ...createdGame,
            Name: 'Updated Test Game',
            Price: 39.99
        };
        
        console.log('📝 Updating game...');
        const modifiedGame = await apiService.modifyGame(updatedGame);
        console.log('✅ Game updated:', modifiedGame);
        
        // Test deleting the game
        console.log('📝 Deleting game...');
        await apiService.deleteGame(modifiedGame.Id);
        console.log('✅ Game deleted successfully');
        
        console.log('✅ CRUD operations test completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ CRUD operations test failed:', error);
        return false;
    }
};

export const testWebSocketIntegration = async () => {
    console.log('🧪 Testing WebSocket simulation integration...');
    
    try {
        // Enable simulation mode
        enableSimulationMode();
        
        // Connect to WebSocket
        websocketService.connect();
        
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`Connection state: ${websocketService.getConnectionState()}`);
        
        // Test starting generation
        websocketService.sendCommand('start');
        console.log('✅ Start command sent');
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`Generation state: ${websocketService.getGenerationState()}`);
        
        // Test stopping generation
        websocketService.sendCommand('stop');
        console.log('✅ Stop command sent');
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`Generation state after stop: ${websocketService.getGenerationState()}`);
        
        console.log('✅ WebSocket simulation test completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ WebSocket simulation test failed:', error);
        return false;
    }
};

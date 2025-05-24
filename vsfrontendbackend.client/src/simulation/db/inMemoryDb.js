// Simple in-memory database for simulation

class InMemoryDb {
  constructor() {
    this.games = [];
    this.users = [];
    this.gameId = 1;
    this.userId = 1;
    
    // Initialize with some sample data
    this._initSampleData();
  }
  
  _initSampleData() {
    // Add sample games
    for (let i = 0; i < 10; i++) {
      this.games.push({
        id: this.gameId++,
        title: `Simulated Game ${i}`,
        description: `This is a simulated game description for game ${i}`,
        moves: this._generateRandomMoves(),
        createdAt: new Date(Date.now() - Math.random() * 10000000),
        status: Math.random() > 0.3 ? 'Completed' : 'In Progress'
      });
    }
    
    // Add sample users
    this.users.push({
      id: this.userId++,
      username: 'admin',
      email: 'admin@example.com',
      role: 'Admin'
    });
    
    this.users.push({
      id: this.userId++,
      username: 'user',
      email: 'user@example.com',
      role: 'User'
    });
  }
  
  _generateRandomMoves() {
    const moves = [];
    const moveCount = Math.floor(Math.random() * 20) + 5;
    
    for (let i = 0; i < moveCount; i++) {
      moves.push({
        id: i + 1,
        from: `${String.fromCharCode(97 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 8) + 1}`,
        to: `${String.fromCharCode(97 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 8) + 1}`,
        piece: ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'][Math.floor(Math.random() * 6)],
        notation: `e4 e5 Nf3 Nc6 Bb5 a6`,
        moveNumber: i + 1
      });
    }
    
    return moves;
  }
  
  // Game methods
  getAllGames() {
    return [...this.games].sort((a, b) => b.id - a.id);
  }
  
  getGameById(id) {
    return this.games.find(game => game.id === id);
  }
  
  addGame(game) {
    const newGame = {
      ...game,
      id: this.gameId++,
      createdAt: new Date(),
      status: 'In Progress',
      moves: []
    };
    this.games.push(newGame);
    return newGame;
  }
  
  updateGame(id, updates) {
    const index = this.games.findIndex(game => game.id === id);
    if (index !== -1) {
      this.games[index] = { ...this.games[index], ...updates };
      return this.games[index];
    }
    return null;
  }
  
  deleteGame(id) {
    const index = this.games.findIndex(game => game.id === id);
    if (index !== -1) {
      const deleted = this.games[index];
      this.games.splice(index, 1);
      return deleted;
    }
    return null;
  }
  
  // User methods
  getAllUsers() {
    return [...this.users];
  }
  
  getUserById(id) {
    return this.users.find(user => user.id === id);
  }
  
  getUserByUsername(username) {
    return this.users.find(user => user.username === username);
  }
  
  addUser(user) {
    const newUser = {
      ...user,
      id: this.userId++
    };
    this.users.push(newUser);
    return newUser;
  }
}

// Create a singleton instance
const db = new InMemoryDb();
export default db;

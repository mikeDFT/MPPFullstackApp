using System.Diagnostics;
using VSFrontendBackend.Server.Models;
using VSFrontendBackend.Server.Services;

namespace VSFrontendBackend.Server.Tests;

public class CRUDTests
{
    private readonly IGameService _gameService;
    private readonly Game _testGame;

    public CRUDTests()
    {
        _gameService = new GameService();
        _testGame = new Game(999, "Test Game", "ROR2Icon", 29.99, 4.5f, "Test game description", new List<string> { "Action", "Adventure" }, new List<string> { "PC", "Xbox" });
    }

    public async Task CreateGame_ValidGame_ReturnsCreatedGame()
    {
        // Act
        var result = _gameService.ModifyAsync(_testGame);

        // Assert
        Debug.Assert(Game.emptyGame != result);
        Debug.Assert(_testGame.Name == result.Name);
        Debug.Assert(_testGame.Price == result.Price);
        Debug.Assert(_testGame.Rating == result.Rating);
        Debug.Assert(_testGame.Genres == result.Genres);
        Debug.Assert(_testGame.Platforms == result.Platforms);
        Debug.Assert(_testGame.Description == result.Description);
    }

    public async Task CreateGame_InvalidGame_ReturnsEmptyGame()
    {
        // Arrange
        var invalidGame = new Game(1000, "Game 1", "ROR2Icon", 29.99, 4.5f, "Test description", new List<string> { "Action" }, new List<string> { "PC" });

        // Act
        var result = _gameService.ModifyAsync(invalidGame);

        // Assert
        Debug.Assert(Game.emptyGame == result);
    }

    public async Task ReadGame_ExistingGame_ReturnsGame()
    {
        // Arrange
        _gameService.ModifyAsync(_testGame);

        // Act
        var result = _gameService.GetByIdAsync(_testGame.Id);

        // Assert
        Debug.Assert(Game.emptyGame != result);
        Debug.Assert(_testGame.Name == result.Name);
        Debug.Assert(_testGame.Price == result.Price);
        Debug.Assert(_testGame.Rating == result.Rating);
    }

    public async Task ReadGame_NonExistingGame_ReturnsEmptyGame()
    {
        // Act
        var result = _gameService.GetByIdAsync(999999);

        // Assert
        Debug.Assert(Game.emptyGame == result);
    }

    public async Task UpdateGame_ExistingGame_ReturnsUpdatedGame()
    {
        // Arrange
        _gameService.ModifyAsync(_testGame);
        var updatedGame = new Game(_testGame.Id, "Updated Test Game", "ROR2Icon", 39.99, 4.8f, "Updated test description", new List<string> { "Action", "Adventure", "RPG" }, new List<string> { "PC", "Xbox", "PS5" });

        // Act
        var result = _gameService.ModifyAsync(updatedGame);

        // Assert
        Debug.Assert(Game.emptyGame != result);
        Debug.Assert(updatedGame.Name == result.Name);
        Debug.Assert(updatedGame.Price == result.Price);
        Debug.Assert(updatedGame.Rating == result.Rating);
        Debug.Assert(updatedGame.Genres == result.Genres);
        Debug.Assert(updatedGame.Platforms == result.Platforms);
        Debug.Assert(updatedGame.Description == result.Description);
    }

    public async Task DeleteGame_ExistingGame_DeletesGame()
    {
        // Arrange
        _gameService.ModifyAsync(_testGame);

        // Act
        _gameService.DeleteAsync(_testGame.Id);

        // Assert
        var result = _gameService.GetByIdAsync(_testGame.Id);
        Debug.Assert(Game.emptyGame == result);
    }
}

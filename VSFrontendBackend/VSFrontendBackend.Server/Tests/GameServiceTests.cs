using Xunit;
using VSFrontendBackend.Server.Models;
using VSFrontendBackend.Server.Services;

namespace VSFrontendBackend.Server.Tests;

public class GameServiceTests
{
    private readonly IGameService _gameService;
    private readonly Game _testGame;

    public GameServiceTests()
    {
        _gameService = new GameService();
        _testGame = new Game(999, "Test Game", "ROR2Icon", 29.99, 4.5f, "Test game description", new List<string> { "Action", "Adventure" }, new List<string> { "PC", "Xbox" });
    }

    public void RunAllTests()
    {
        TestCreateGame_ValidGame_ReturnsCreatedGame();
        TestCreateGame_InvalidGame_ReturnsEmptyGame();
        TestReadGame_ExistingGame_ReturnsGame();
        TestReadGame_NonExistingGame_ReturnsEmptyGame();
    }

    [Fact]
    public void TestCreateGame_ValidGame_ReturnsCreatedGame()
    {
        // Act
        var result = _gameService.ModifyAsync(_testGame);

        // Assert
        Assert.NotEqual(Game.emptyGame, result);
        Assert.Equal(_testGame.Name, result.Name);
        Assert.Equal(_testGame.Price, result.Price);
        Assert.Equal(_testGame.Rating, result.Rating);
        Assert.Equal(_testGame.Genres, result.Genres);
        Assert.Equal(_testGame.Platforms, result.Platforms);
        Assert.Equal(_testGame.Description, result.Description);
    }

    [Fact]
    public void TestCreateGame_InvalidGame_ReturnsEmptyGame()
    {
        // Arrange
        var invalidGame = new Game(-1, "Game 1", "ROR2Icon", 29.99, 4.5f, "Test description", new List<string> { "Action" }, new List<string> { "PC" });

        // Act
        var result = _gameService.ModifyAsync(invalidGame);

        // Assert
        Assert.Equal(Game.emptyGame, result);
    }

    [Fact]
    public void TestReadGame_ExistingGame_ReturnsGame()
    {
        // Arrange
        _gameService.ModifyAsync(_testGame);

        // Act
        var result = _gameService.GetByIdAsync(_testGame.Id);

        // Assert
        Assert.NotEqual(Game.emptyGame, result);
        Assert.Equal(_testGame.Name, result.Name);
        Assert.Equal(_testGame.Price, result.Price);
        Assert.Equal(_testGame.Rating, result.Rating);
    }

    [Fact]
    public void TestReadGame_NonExistingGame_ReturnsEmptyGame()
    {
        // Act
        var result = _gameService.GetByIdAsync(999999);

        // Assert
        Assert.Equal(Game.emptyGame, result);
    }

    [Fact]
    public void TestUpdateGame_ExistingGame_ReturnsUpdatedGame()
    {
        // Arrange
        _gameService.ModifyAsync(_testGame);
        var updatedGame = new Game(999, "Updated Test Game", "ROR2Icon", 39.99, 4.8f, "Updated test description", new List<string> { "Action", "Adventure", "RPG" }, new List<string> { "PC", "Xbox", "PS5" });

        // Act
        var result = _gameService.ModifyAsync(updatedGame);

        // Assert
        Assert.NotEqual(Game.emptyGame, result);
        Assert.Equal(updatedGame.Name, result.Name);
        Assert.Equal(updatedGame.Price, result.Price);
        Assert.Equal(updatedGame.Rating, result.Rating);
        Assert.Equal(updatedGame.Genres, result.Genres);
        Assert.Equal(updatedGame.Platforms, result.Platforms);
        Assert.Equal(updatedGame.Description, result.Description);
    }

    [Fact]
    public void TestDeleteGame_ExistingGame_DeletesGame()
    {
        // Arrange
        _gameService.ModifyAsync(_testGame);

        // Act
        _gameService.DeleteAsync(_testGame.Id);

        // Assert
        var result = _gameService.GetByIdAsync(_testGame.Id);
        Assert.Equal(Game.emptyGame, result);
    }

    [Fact]
    public void TestSortingAndFiltering_SortByName_ReturnsSortedGames()
    {
        // Arrange
        var testGames = new List<Game>
        {
            new Game(1, "Zelda", "ROR2Icon", 59.99, 5.0f, "Legend of Zelda", new List<string> { "Action", "Adventure" }, new List<string> { "Nintendo Switch" }),
            new Game(2, "Mario", "ROR2Icon", 49.99, 4.5f, "Super Mario", new List<string> { "Platform", "Family" }, new List<string> { "Nintendo Switch" }),
            new Game(3, "Call of Duty", "ROR2Icon", 69.99, 4.0f, "Call of Duty", new List<string> { "FPS", "Action" }, new List<string> { "PC", "Xbox", "PS5" }),
        };

        foreach (var game in testGames)
        {
            _gameService.ModifyAsync(game);
        }

        var sortByNameParams = new FilterSortingGamesParams
        {
            SortBy = "Name",
            Ascending = true
        };

        // Act
        var result = _gameService.GetAllAsync(sortByNameParams);

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal("Call of Duty", result[0].Name);
        Assert.Equal("Mario", result[1].Name);
        Assert.Equal("Zelda", result[2].Name);
    }

    [Fact]
    public void TestSortingAndFiltering_FilterByGenre_ReturnsMatchingGames()
    {
        // Arrange
        var testGames = new List<Game>
        {
            new Game(1, "Zelda", "ROR2Icon", 59.99, 5.0f, "Legend of Zelda", new List<string> { "Action", "Adventure" }, new List<string> { "Nintendo Switch" }),
            new Game(2, "Mario", "ROR2Icon", 49.99, 4.5f, "Super Mario", new List<string> { "Platform", "Family" }, new List<string> { "Nintendo Switch" }),
            new Game(3, "Call of Duty", "ROR2Icon", 69.99, 4.0f, "Call of Duty", new List<string> { "FPS", "Action" }, new List<string> { "PC", "Xbox", "PS5" }),
        };

        foreach (var game in testGames)
        {
            _gameService.ModifyAsync(game);
        }

        var genreParams = new FilterSortingGamesParams
        {
            Genres = new List<string> { "Action" }
        };

        // Act
        var result = _gameService.GetAllAsync(genreParams);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, game => Assert.Contains("Action", game.Genres));
    }

    [Fact]
    public void TestSortingAndFiltering_FilterByPlatform_ReturnsMatchingGames()
    {
        // Arrange
        var testGames = new List<Game>
        {
            new Game(1, "Zelda", "ROR2Icon", 59.99, 5.0f, "Legend of Zelda", new List<string> { "Action", "Adventure" }, new List<string> { "Nintendo Switch" }),
            new Game(2, "Mario", "ROR2Icon", 49.99, 4.5f, "Super Mario", new List<string> { "Platform", "Family" }, new List<string> { "Nintendo Switch" }),
            new Game(3, "Call of Duty", "ROR2Icon", 69.99, 4.0f, "Call of Duty", new List<string> { "FPS", "Action" }, new List<string> { "PC", "Xbox", "PS5" }),
        };

        foreach (var game in testGames)
        {
            _gameService.ModifyAsync(game);
        }

        var platformParams = new FilterSortingGamesParams
        {
            Platforms = new List<string> { "Nintendo Switch" }
        };

        // Act
        var result = _gameService.GetAllAsync(platformParams);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, game => Assert.Contains("Nintendo Switch", game.Platforms));
    }

    [Fact]
    public void TestSortingAndFiltering_SearchByName_ReturnsMatchingGames()
    {
        // Arrange
        var testGames = new List<Game>
        {
            new Game(1, "Zelda", "ROR2Icon", 59.99, 5.0f, "Legend of Zelda", new List<string> { "Action", "Adventure" }, new List<string> { "Nintendo Switch" }),
            new Game(2, "Mario", "ROR2Icon", 49.99, 4.5f, "Super Mario", new List<string> { "Platform", "Family" }, new List<string> { "Nintendo Switch" }),
            new Game(3, "Call of Duty", "ROR2Icon", 69.99, 4.0f, "Call of Duty", new List<string> { "FPS", "Action" }, new List<string> { "PC", "Xbox", "PS5" }),
        };

        foreach (var game in testGames)
        {
            _gameService.ModifyAsync(game);
        }

        var searchParams = new FilterSortingGamesParams
        {
            SearchText = "Mario"
        };

        // Act
        var result = _gameService.GetAllAsync(searchParams);

        // Assert
        Assert.Single(result);
        Assert.Equal("Mario", result[0].Name);
    }

    [Fact]
    public void TestSortingAndFiltering_CombinedFilters_ReturnsMatchingGames()
    {
        // Arrange
        var testGames = new List<Game>
        {
            new Game(1, "Zelda", "ROR2Icon", 59.99, 5.0f, "Legend of Zelda", new List<string> { "Action", "Adventure" }, new List<string> { "Nintendo Switch" }),
            new Game(2, "Mario", "ROR2Icon", 49.99, 4.5f, "Super Mario", new List<string> { "Platform", "Family" }, new List<string> { "Nintendo Switch" }),
            new Game(3, "Call of Duty", "ROR2Icon", 69.99, 4.0f, "Call of Duty", new List<string> { "FPS", "Action" }, new List<string> { "PC", "Xbox", "PS5" }),
        };

        foreach (var game in testGames)
        {
            _gameService.ModifyAsync(game);
        }

        var combinedParams = new FilterSortingGamesParams
        {
            Genres = new List<string> { "Action" },
            Platforms = new List<string> { "PC" },
            SortBy = "Price",
            Ascending = true
        };

        // Act
        var result = _gameService.GetAllAsync(combinedParams);

        // Assert
        Assert.Single(result);
        Assert.Equal("Call of Duty", result[0].Name);
        Assert.Contains("Action", result[0].Genres);
        Assert.Contains("PC", result[0].Platforms);
    }
} 
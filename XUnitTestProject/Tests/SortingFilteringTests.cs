//using System.Diagnostics;
//using VSFrontendBackend.Server.Domain;
//using VSFrontendBackend.Server.Repository;
//using VSFrontendBackend.Server.Services;

//namespace VSFrontendBackend.Server.Tests;

//public class SortingFilteringTests
//{
//    private readonly IGameService _gameService;
//    private readonly List<Game> _testGames;

//    public SortingFilteringTests()
//    {
//        _gameService = new GameService(new GameRepository());
//        _testGames = new List<Game>
//        {
//            new Game(1, "Zelda", "ROR2Icon", 59.99, 5.0f, "Legend of Zelda", new List<string> { "Action", "Adventure" }, new List<string> { "Nintendo Switch" }),
//            new Game(2, "Mario", "ROR2Icon", 49.99, 4.5f, "Super Mario", new List<string> { "Platform", "Family" }, new List<string> { "Nintendo Switch" }),
//            new Game(3, "Call of Duty", "ROR2Icon", 69.99, 4.0f, "Call of Duty", new List<string> { "FPS", "Action" }, new List<string> { "PC", "Xbox", "PS5" }),
//        };

//        // Add test games to the service
//        foreach (var game in _testGames)
//        {
//            _gameService.ModifyAsync(game);
//        }
//    }

//    public async Task SortByName_Ascending_ReturnsSortedGames()
//    {
//        // Arrange
//        var Params = new FilterSortingGamesParams
//        {
//            SortBy = "Name",
//            Ascending = true
//        };

//        // Act
//        var result = _gameService.GetAllAsync(Params);

//        // Assert
//        Debug.Assert(3 == result.Count);
//        Debug.Assert("Call of Duty" == result[0].Name);
//        Debug.Assert("Mario" == result[1].Name);
//        Debug.Assert("Zelda" == result[2].Name);
//    }

//    public async Task SortByName_Descending_ReturnsSortedGames()
//    {
//        // Arrange
//        var Params = new FilterSortingGamesParams
//        {
//            SortBy = "Name",
//            Ascending = false
//        };

//        // Act
//        var result = _gameService.GetAllAsync(Params);

//        // Assert
//        Debug.Assert(3 == result.Count);
//        Debug.Assert("Zelda" == result[0].Name);
//        Debug.Assert("Mario" == result[1].Name);
//        Debug.Assert("Call of Duty" == result[2].Name);
//    }

//    public async Task SortByPrice_Ascending_ReturnsSortedGames()
//    {
//        // Arrange
//        var Params = new FilterSortingGamesParams
//        {
//            SortBy = "Price",
//            Ascending = true
//        };

//        // Act
//        var result = _gameService.GetAllAsync(Params);

//        // Assert
//        Debug.Assert(3 == result.Count);
//        Debug.Assert(49.99 == result[0].Price);
//        Debug.Assert(59.99 == result[1].Price);
//        Debug.Assert(69.99 == result[2].Price);
//    }

//    public async Task FilterByGenre_ReturnsMatchingGames()
//    {
//        // Arrange
//        var Params = new FilterSortingGamesParams
//        {
//            Genres = new List<string> { "Action" }
//        };

//        // Act
//        var result = _gameService.GetAllAsync(Params);

//        // Assert
//        Debug.Assert(2 == result.Count);
//        Debug.Assert(result.All(game => game.Genres.Contains("Action")));
//    }

//    public async Task FilterByPlatform_ReturnsMatchingGames()
//    {
//        // Arrange
//        var Params = new FilterSortingGamesParams
//        {
//            Platforms = new List<string> { "Nintendo Switch" }
//        };

//        // Act
//        var result = _gameService.GetAllAsync(Params);

//        // Assert
//        Debug.Assert(2 == result.Count);
//        Debug.Assert(result.All(game => game.Platforms.Contains("Nintendo Switch")));
//    }

//    public async Task SearchByName_ReturnsMatchingGames()
//    {
//        // Arrange
//        var Params = new FilterSortingGamesParams
//        {
//            SearchText = "Mario"
//        };

//        // Act
//        var result = _gameService.GetAllAsync(Params);

//        // Assert
//        Debug.Assert(1 == result.Count);
//        Debug.Assert("Mario" == result[0].Name);
//    }

//    public async Task CombinedFilters_ReturnsMatchingGames()
//    {
//        // Arrange
//        var Params = new FilterSortingGamesParams
//        {
//            Genres = new List<string> { "Action" },
//            Platforms = new List<string> { "PC" },
//            SortBy = "Price",
//            Ascending = true
//        };

//        // Act
//        var result = _gameService.GetAllAsync(Params);

//        // Assert
//        Debug.Assert(1 == result.Count);
//        Debug.Assert("Call of Duty" == result[0].Name);
//        Debug.Assert(result[0].Genres.Contains("Action"));
//        Debug.Assert(result[0].Platforms.Contains("PC"));
//    }
//}

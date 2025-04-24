using System.Diagnostics;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Repository;

namespace VSFrontendBackend.Server.Services;

public interface IGameService
{
    Task<List<Game>> GetAllAsync(FilterSortingGamesParams filterSortingGamesParams);
    Task<Game> GetByIdAsync(int id);
    Task<Game> ModifyAsync(Game game);
    Task DeleteAsync(int id);
}

public class GameService : IGameService
{
    private readonly IGameRepository _gameRepository;

    public GameService(IGameRepository gameRepository)
    {
        _gameRepository = gameRepository;
    }

    public async Task<List<Game>> GetAllAsync(FilterSortingGamesParams filterSortingGamesParams)
    {
        List<Game> games = await _gameRepository.GetAllAsync();

        if (filterSortingGamesParams.SearchText != null)
        {
            games = games.Where(g => g.Name.Contains(filterSortingGamesParams.SearchText, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (filterSortingGamesParams.Genres != null)
        {
            foreach (var genre in filterSortingGamesParams.Genres)
            {
                games = games.Where(g => g.Genres.Contains(genre)).ToList();
            }
        }

        if (filterSortingGamesParams.Platforms != null)
        {
            foreach (var platform in filterSortingGamesParams.Platforms)
            {
                games = games.Where(g => g.Platforms.Contains(platform)).ToList();
            }
        }

        if (filterSortingGamesParams.SortBy == "Price")
        {
            games = filterSortingGamesParams.Ascending
                ? games.OrderBy(g => g.Price).ToList()
                : games.OrderByDescending(g => g.Price).ToList();
        }
        else if (filterSortingGamesParams.SortBy == "Rating")
        {
            games = filterSortingGamesParams.Ascending
                ? games.OrderBy(g => g.Rating).ToList()
                : games.OrderByDescending(g => g.Rating).ToList();
        }
        else if (filterSortingGamesParams.SortBy == "Name")
        {
            games = filterSortingGamesParams.Ascending
                ? games.OrderBy(g => g.Name).ToList()
                : games.OrderByDescending(g => g.Name).ToList();
        }

        return games;
    }

    public async Task<Game> GetByIdAsync(int id)
    {
        return await _gameRepository.GetByIdAsync(id);
    }

    private bool isValid(Game game)
    {
        // No need to check ID for validation, as we handle new vs existing games separately
        
        if (string.IsNullOrEmpty(game.Name))
            return false;

        if (game.Price <= 0)
            return false;

        if (game.Rating < 1 || game.Rating > 5)
            return false;

        if (game.Genres == null)
            return false;

        if (game.Platforms == null)
            return false;

        if (string.IsNullOrEmpty(game.Description))
            return false;

        return true;
    }

    public async Task<Game> ModifyAsync(Game game)
    {
        Debug.WriteLine("MODIFY GAME");
        Debug.WriteLine($"Game ID: {game.Id}, Name: {game.Name}");

        if (!isValid(game))
            return Game.emptyGame;

        try
        {
            // If ID is 0 or negative, it's a new game
            if (game.Id <= 0)
            {
                Debug.WriteLine("Adding new game");
                return await _gameRepository.AddAsync(game);
            }
            else
            {
                // Check if the game exists before updating
                var existingGame = await _gameRepository.GetByIdAsync(game.Id);
                if (existingGame != Game.emptyGame)
                {
                    Debug.WriteLine("Updating existing game");
                    return await _gameRepository.UpdateAsync(game);
                }
                else
                {
                    // ID was provided but game doesn't exist, so add it as a new game
                    Debug.WriteLine("Game ID provided but not found - adding as new");
                    return await _gameRepository.AddAsync(game);
                }
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Error in ModifyAsync: {ex.Message}");
            throw;
        }
    }

    public async Task DeleteAsync(int id)
    {
        await _gameRepository.DeleteAsync(id);
    }
}
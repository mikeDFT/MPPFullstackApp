using System.Diagnostics;
using VSFrontendBackend.Server.Models;
using VSFrontendBackend.Server.Repository;


namespace VSFrontendBackend.Server.Services;

public interface IGameService
{
    List<Game> GetAllAsync(FilterSortingGamesParams filterSortingGamesParams);
    Game GetByIdAsync(int id);
    Game ModifyAsync(Game game);
    void DeleteAsync(int id);
}

public class GameService : IGameService
{
    private readonly IGameRepository _gameRepository;

    public GameService()
    {
        _gameRepository = new GameRepository();
    }

    public List<Game> GetAllAsync(FilterSortingGamesParams filterSortingGamesParams)
    {
        List<Game> games = _gameRepository.GetAllAsync();

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

    public Game GetByIdAsync(int id)
    {
        return _gameRepository.GetByIdAsync(id);
    }

    private bool isValid(Game game)
    {
        if (game.Id <= 0)
            return false;

        if (game.Name == null || game.Name == "")
            return false;

        if (game.Price <= 0)
            return false;

        if (game.Rating < 1 || game.Rating > 5)
            return false;

        if (game.Genres == null)
            return false;

        if (game.Platforms == null)
            return false;

        if (game.Description == null || game.Description == "")
            return false;

        return true;
    }

    public Game ModifyAsync(Game game)
    {
        Debug.WriteLine(game);

        if (!isValid(game))
            return Game.emptyGame;

        // if the game already exists, then update it, otherwise add it
        if (_gameRepository.GetByIdAsync(game.Id) != Game.emptyGame)
        {
            return _gameRepository.UpdateAsync(game);
        }
        else
        {
            Debug.WriteLine("add");
            return _gameRepository.AddAsync(game);
        }
    }

    public void DeleteAsync(int id)
    {
        _gameRepository.DeleteAsync(id);
    }
}
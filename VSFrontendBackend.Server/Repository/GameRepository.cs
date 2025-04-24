using VSFrontendBackend.Server.Domain;

namespace VSFrontendBackend.Server.Repository;

public interface IGameRepository
{
    List<Game> GetAllAsync();
    Game GetByIdAsync(int id);
    Game AddAsync(Game game);
    Game UpdateAsync(Game game);
    void DeleteAsync(int id);
}

public class GameRepository : IGameRepository
{
    private static List<Game> _games = [
        //new Game(1, 0, "Game 1", "ROR2Icon", 100, 4.5, "Description 1", ["COOP", "Roguelike"], ["PC", "Android", "Xbox"], null),
        //new Game(2, 0, "Game 2", "DBDIcon", 200, 4.2, "Description 2", ["FPS", "Horror"], ["PC", "Android", "Xbox"], null),
        //new Game(3, 0, "Game 3", "DBDIcon", 300, 4.7, "Description 3", ["FPS", "Roguelike"], ["PC", "PlayStation", "Xbox"], null),
        //new Game(4, 0, "Game 4", "ROR2Icon", 400, 4.3, "Description 4", ["FPS", "Horror"], ["PC", "Xbox"]),
        //new Game(5, 0, "Game 5", "DBDIcon", 500, 4.8, "Description 5", ["FPS", "Roguelike"], ["Android", "Xbox"]),
    ];

    public List<Game> GetAllAsync()
    {
        return _games;
    }

    public Game GetByIdAsync(int id)
    {
        var index = _games.FindIndex(g => g.Id == id);
        if (index != -1)
        {
            return _games[index];
        }

        return Game.emptyGame;
    }

    public Game AddAsync(Game game)
    {
        _games.Add(game);
        return game;
    }

    public Game UpdateAsync(Game game)
    {
        var index = _games.FindIndex(g => g.Id == game.Id);
        if (index != -1)
        {
            _games[index] = game;
        }
        return game;
    }
    
    public void DeleteAsync(int id)
    {
        _games.RemoveAll(g => g.Id == id);
    }
}
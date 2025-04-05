using Microsoft.AspNetCore.Mvc;
using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Models;
using System.Diagnostics;

namespace backend.Server.Controllers;
 
[ApiController]
//[Route("[controller]")]
[Route("game")]
public class GameController : ControllerBase
{
    private readonly IGameService _gameService;

    public GameController(ILogger<GameController> logger)
    {
        _gameService = new GameService();
    }

    [HttpGet(Name = "GameData")]
    public IEnumerable<Game> Get([FromQuery] FilterSortingGamesParams filterSortingGamesParams)
    {
        Debug.WriteLine(filterSortingGamesParams.SortBy);
        Debug.WriteLine(filterSortingGamesParams.Ascending);
        Debug.WriteLine(filterSortingGamesParams.Genres!=null ? filterSortingGamesParams.Genres.Count : null);
        Debug.WriteLine(filterSortingGamesParams.Platforms!= null ? filterSortingGamesParams.Platforms.Count : null);
        Debug.WriteLine(filterSortingGamesParams.SearchText);

        if (filterSortingGamesParams.Platforms == null)
            filterSortingGamesParams.Platforms = [];

        if (filterSortingGamesParams.Genres == null)
            filterSortingGamesParams.Genres = [];

        filterSortingGamesParams.Platforms.RemoveAll((el) => el == null);
        filterSortingGamesParams.Genres.RemoveAll((el) => el == null);

        Debug.WriteLine(filterSortingGamesParams.Genres.Count);
        foreach (var genre in filterSortingGamesParams.Genres)
            Debug.WriteLine("|" + genre + "|");

        var games = _gameService.GetAllAsync(filterSortingGamesParams);
        foreach(var g in games)
            Debug.WriteLine(g.Name);

        return games;
    }

    [HttpGet("{id}", Name = "GetGameById")]
    public Game Get(int id)
    {
        return _gameService.GetByIdAsync(id);
    }

    [HttpPost(Name = "ModifyGame")]
    public IActionResult Post(Game game)
    {
        _gameService.ModifyAsync(game);
        return Ok(game);
    }

    //[HttpPut("{id}", Name = "UpdateGame")]
    //public void Put(int id, Game game)
    //{
    //    _gameService.UpdateAsync(game);
    //}

    [HttpDelete("{id}", Name = "DeleteGame")]
    public IActionResult Delete(int id)
    {
        _gameService.DeleteAsync(id);
        return Ok(id);
    }
}

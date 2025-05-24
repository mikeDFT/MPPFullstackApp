using Microsoft.AspNetCore.Mvc;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Domain.DTOs;
using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Utils;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Diagnostics;

namespace VSFrontendBackend.Server.Controllers
{
    [ApiController]
    [Route("game")]
    public class GameController : ControllerBase
    {
        private readonly IGameService _gameService;
        private readonly ILogService _logService;

        public GameController(IGameService gameService, ILogService logService)
        {
            _gameService = gameService;
            _logService = logService;
        }

        [HttpGet(Name = "GameData")]
        public async Task<IActionResult> Get([FromQuery] FilterSortingGamesParams filterSortingGamesParams)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                if (filterSortingGamesParams.Platforms == null)
                    filterSortingGamesParams.Platforms = [];

                if (filterSortingGamesParams.Genres == null)
                    filterSortingGamesParams.Genres = [];

                filterSortingGamesParams.CompanySearchText ??= string.Empty;

                filterSortingGamesParams.Platforms.RemoveAll((el) => el == null);
                filterSortingGamesParams.Genres.RemoveAll((el) => el == null);

                if (filterSortingGamesParams == null)
                    filterSortingGamesParams = new FilterSortingGamesParams();                var games = await _gameService.GetAllAsync(filterSortingGamesParams);
                
                // Add 2 dummy games if the list is empty
                if (games.Count == 0)
                {
                    games.Add(new Game
                    {
                        Id = 1,
                        CompanyID = -1,
                        Company = Company.emptyCompany,
                        Name = "Epic Adventure Quest",
                        IconID = "adventure_icon",
                        Price = 29.99,
                        Rating = 4.5,
                        Description = "Embark on an epic adventure through mystical lands filled with challenges, treasures, and legendary creatures. Perfect for solo or multiplayer gameplay.",
                        Genres = new List<string> { "Adventure", "RPG", "Action" },
                        Platforms = new List<string> { "PC", "Xbox", "PlayStation" }
                    });
                    
                    games.Add(new Game
                    {
                        Id = 2,
                        CompanyID = -1,
                        Company = Company.emptyCompany,
                        Name = "Space Commander",
                        IconID = "space_icon",
                        Price = 39.99,
                        Rating = 4.2,
                        Description = "Command your own spaceship and explore the galaxy in this thrilling space simulation game. Build, trade, and fight your way to becoming the ultimate space commander.",
                        Genres = new List<string> { "Strategy", "Simulation", "Sci-Fi" },
                        Platforms = new List<string> { "PC", "Nintendo Switch", "Mobile" }
                    });
                }
                
                var gameDTOs = GameDTO.FromGameList(games);
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GetGames",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Retrieved {games.Count} games with filter: {JsonSerializer.Serialize(filterSortingGamesParams)}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "200 OK",
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
                
                return Ok(gameDTOs);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GetGames",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Error retrieving games with filter: {JsonSerializer.Serialize(filterSortingGamesParams)}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "500 Error",
                    DurationMs = stopwatch.ElapsedMilliseconds,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
                
                throw;
            }
        }

        [HttpGet("{id}", Name = "GetGameById")]
        public async Task<IActionResult> Get(int id)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                var game = await _gameService.GetByIdAsync(id);
                var gameDTO = GameDTO.FromGame(game);
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GetGameById",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Retrieved game with ID: {id}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "200 OK",
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
                
                return Ok(gameDTO);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GetGameById",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Error retrieving game with ID: {id}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "500 Error",
                    DurationMs = stopwatch.ElapsedMilliseconds,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
                
                throw;
            }
        }

        [HttpPost(Name = "ModifyGame")]
        public async Task<IActionResult> Post(GameDTO gameDTO)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                var game = gameDTO.ToGame();
                var result = await _gameService.ModifyAsync(game);
                var resultDTO = GameDTO.FromGame(result);
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = game.Id == 0 ? "CreateGame" : "UpdateGame",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"{(game.Id == 0 ? "Created" : "Updated")} game: {game.Name} (ID: {result.Id})",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "200 OK",
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
                
                return Ok(resultDTO);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = gameDTO.Id == 0 ? "CreateGame" : "UpdateGame",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Error {(gameDTO.Id == 0 ? "creating" : "updating")} game: {gameDTO.Name}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "500 Error",
                    DurationMs = stopwatch.ElapsedMilliseconds,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
                
                throw;
            }
        }

        [HttpDelete("{id}", Name = "DeleteGame")]
        public async Task<IActionResult> Delete(int id)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                await _gameService.DeleteAsync(id);
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "DeleteGame",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Deleted game with ID: {id}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "200 OK",
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
                
                return Ok(id);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "DeleteGame",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Error deleting game with ID: {id}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "500 Error",
                    DurationMs = stopwatch.ElapsedMilliseconds,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
                
                throw;
            }
        }
    }
}

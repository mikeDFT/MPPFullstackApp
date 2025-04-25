using Microsoft.AspNetCore.Mvc;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Domain.DTOs;
using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Utils;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace VSFrontendBackend.Server.Controllers
{
    [ApiController]
    [Route("game")]
    public class GameController : ControllerBase
    {
        private readonly IGameService _gameService;

        public GameController(IGameService gameService)
        {
            _gameService = gameService;
        }

        [HttpGet(Name = "GameData")]
        public async Task<IActionResult> Get([FromQuery] FilterSortingGamesParams filterSortingGamesParams)
        {
            if (filterSortingGamesParams.Platforms == null)
                filterSortingGamesParams.Platforms = [];

            if (filterSortingGamesParams.Genres == null)
                filterSortingGamesParams.Genres = [];

            filterSortingGamesParams.Platforms.RemoveAll((el) => el == null);
            filterSortingGamesParams.Genres.RemoveAll((el) => el == null);

            if (filterSortingGamesParams == null)
                filterSortingGamesParams = new FilterSortingGamesParams();

            var games = await _gameService.GetAllAsync(filterSortingGamesParams);
            var gameDTOs = GameDTO.FromGameList(games);
            return Ok(gameDTOs);
        }

        [HttpGet("{id}", Name = "GetGameById")]
        public async Task<IActionResult> Get(int id)
        {
            var game = await _gameService.GetByIdAsync(id);
            var gameDTO = GameDTO.FromGame(game);
            return Ok(gameDTO);
        }

        [HttpPost(Name = "ModifyGame")]
        public async Task<IActionResult> Post(GameDTO gameDTO)
        {
            var game = gameDTO.ToGame();
            var result = await _gameService.ModifyAsync(game);
            var resultDTO = GameDTO.FromGame(result);
            return Ok(resultDTO);
        }

        [HttpDelete("{id}", Name = "DeleteGame")]
        public async Task<IActionResult> Delete(int id)
        {
            await _gameService.DeleteAsync(id);
            return Ok(id);
        }
    }
}

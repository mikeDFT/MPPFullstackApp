using Microsoft.AspNetCore.Mvc;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Services;
using System.Threading.Tasks;

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
        public async Task<IEnumerable<Game>> Get([FromQuery] FilterSortingGamesParams filterSortingGamesParams)
        {
            if (filterSortingGamesParams.Platforms == null)
                filterSortingGamesParams.Platforms = [];

            if (filterSortingGamesParams.Genres == null)
                filterSortingGamesParams.Genres = [];

            filterSortingGamesParams.Platforms.RemoveAll((el) => el == null);
            filterSortingGamesParams.Genres.RemoveAll((el) => el == null);

            if (filterSortingGamesParams == null)
                filterSortingGamesParams = new FilterSortingGamesParams();

            return await _gameService.GetAllAsync(filterSortingGamesParams);
        }

        [HttpGet("{id}", Name = "GetGameById")]
        public async Task<Game> Get(int id)
        {
            return await _gameService.GetByIdAsync(id);
        }

        [HttpPost(Name = "ModifyGame")]
        public async Task<IActionResult> Post(Game game)
        {
            var result = await _gameService.ModifyAsync(game);
            return Ok(result);
        }

        [HttpDelete("{id}", Name = "DeleteGame")]
        public async Task<IActionResult> Delete(int id)
        {
            await _gameService.DeleteAsync(id);
            return Ok(id);
        }
    }
}

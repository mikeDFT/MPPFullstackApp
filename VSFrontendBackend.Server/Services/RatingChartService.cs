using VSFrontendBackend.Server.Repository;
using VSFrontendBackend.Server.Domain;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace VSFrontendBackend.Server.Services
{
    public interface IRatingChartService
    {
        Task<Dictionary<string, int>> GetRatingDistributionAsync();
    }

    public class RatingChartService : IRatingChartService
    {
        private readonly IGameRepository _gameRepository;

        public RatingChartService(IGameRepository gameRepository)
        {
            _gameRepository = gameRepository;
        }

        public async Task<Dictionary<string, int>> GetRatingDistributionAsync()
        {
            // Fetch all games
            var games = await _gameRepository.GetAllAsync();

            // Initialize rating counts
            var ratingCounts = new Dictionary<string, int>
            {
                { "1-2", 0 },
                { "2-3", 0 },
                { "3-4", 0 },
                { "4-5", 0 }
            };

            // Count games in each rating interval
            foreach (var game in games)
            {
                if (game.Rating < 2)
                {
                    ratingCounts["1-2"]++;
                }
                else if (game.Rating >= 2 && game.Rating < 3)
                {
                    ratingCounts["2-3"]++;
                }
                else if (game.Rating >= 3 && game.Rating < 4)
                {
                    ratingCounts["3-4"]++;
                }
                else if (game.Rating >= 4)
                {
                    ratingCounts["4-5"]++;
                }
            }

            return ratingCounts;
        }
    }
}

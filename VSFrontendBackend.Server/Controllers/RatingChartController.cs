using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using VSFrontendBackend.Server.Services;

namespace VSFrontendBackend.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RatingChartController : ControllerBase
    {
        private readonly IRatingChartService _ratingChartService;

        public RatingChartController(IRatingChartService ratingChartService)
        {
            _ratingChartService = ratingChartService;
        }

        [HttpGet]
        public async Task<ActionResult<Dictionary<string, int>>> GetRatingDistribution()
        {
            var distribution = await _ratingChartService.GetRatingDistributionAsync();
            return Ok(distribution);
        }
    }
}

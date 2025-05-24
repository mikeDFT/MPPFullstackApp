using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using VSFrontendBackend.Server.Services;
using System.Diagnostics;
using VSFrontendBackend.Server.Domain;
using System;

namespace VSFrontendBackend.Server.Controllers
{
    [ApiController]
    [Route("ratingchart")]
    public class RatingChartController : ControllerBase
    {
        private readonly IRatingChartService _ratingChartService;
        private readonly ILogService _logService;

        public RatingChartController(IRatingChartService ratingChartService, ILogService logService)
        {
            _ratingChartService = ratingChartService;
            _logService = logService;
        }

        [HttpGet]
        public async Task<ActionResult<Dictionary<string, int>>> GetRatingDistribution()
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                Debug.WriteLine("Getting rating distribution data");
                var distribution = await _ratingChartService.GetRatingDistributionAsync();
                
                stopwatch.Stop();
                  await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GetRatingDistribution",
                    RequestPath = HttpContext.Request.Path,
                    Message = "Retrieved rating distribution data",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                    Status = "200 OK",
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
                
                Debug.WriteLine($"Rating distribution: {System.Text.Json.JsonSerializer.Serialize(distribution)}");
                return Ok(distribution);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                Debug.WriteLine($"Error getting rating distribution: {ex.Message}");
                  await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GetRatingDistribution",
                    RequestPath = HttpContext.Request.Path,
                    Message = "Error retrieving rating distribution data",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                    Status = "500 Error",
                    DurationMs = stopwatch.ElapsedMilliseconds,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
                
                throw;
            }
        }
    }
}

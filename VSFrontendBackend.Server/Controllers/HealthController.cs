using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;

namespace VSFrontendBackend.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new 
            { 
                status = "healthy", 
                time = DateTime.UtcNow
            });
        }
        
        [HttpGet("echo")]
        public IActionResult Echo([FromQuery] string message)
        {
            return Ok(new 
            { 
                received = message, 
                timestamp = DateTime.UtcNow,
                headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString())
            });
        }
    }
}

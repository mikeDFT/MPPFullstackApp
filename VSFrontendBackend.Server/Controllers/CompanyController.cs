using Microsoft.AspNetCore.Mvc;
using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Domain;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json;

namespace VSFrontendBackend.Server.Controllers
{
    [ApiController]
    [Route("company")]
    public class CompanyController : ControllerBase
    {
        private readonly ICompanyService _companyService;
        private readonly ILogService _logService;
        private static int _instanceCount = 0;
        private readonly int _instanceId;

        public CompanyController(ICompanyService companyService, ILogService logService)
        {
            _instanceId = Interlocked.Increment(ref _instanceCount);
            _companyService = companyService;
            _logService = logService;
        }

        [HttpGet(Name = "CompanyData")]
        public async Task<IEnumerable<Company>> Get([FromQuery] FilterSortingCompaniesParams filterSortingCompaniesParams)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                if (filterSortingCompaniesParams == null)
                    filterSortingCompaniesParams = new FilterSortingCompaniesParams();

                var companies = await _companyService.GetAllAsync(filterSortingCompaniesParams);
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GetCompanies",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Retrieved {companies.Count()} companies with filter: {JsonSerializer.Serialize(filterSortingCompaniesParams)}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "200 OK",
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
                
                return companies;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GetCompanies",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Error retrieving companies with filter: {JsonSerializer.Serialize(filterSortingCompaniesParams)}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "500 Error",
                    DurationMs = stopwatch.ElapsedMilliseconds,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
                
                throw;
            }
        }

        [HttpGet("{id}", Name = "GetCompanyById")]
        public async Task<Company> Get(int id)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                var company = await _companyService.GetByIdAsync(id);
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GetCompanyById",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Retrieved company with ID: {id}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "200 OK",
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
                
                return company;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GetCompanyById",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Error retrieving company with ID: {id}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "500 Error",
                    DurationMs = stopwatch.ElapsedMilliseconds,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
                
                throw;
            }
        }

        [HttpPost(Name = "ModifyCompany")]
        public async Task<IActionResult> Post(Company company)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                var result = await _companyService.ModifyAsync(company);
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = company.Id == 0 ? "CreateCompany" : "UpdateCompany",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"{(company.Id == 0 ? "Created" : "Updated")} company: {company.CompanyName} (ID: {result.Id})",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "200 OK",
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = company.Id == 0 ? "CreateCompany" : "UpdateCompany",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Error {(company.Id == 0 ? "creating" : "updating")} company: {company.CompanyName}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "500 Error",
                    DurationMs = stopwatch.ElapsedMilliseconds,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
                
                throw;
            }
        }

        [HttpDelete("{id}", Name = "DeleteCompany")]
        public async Task<IActionResult> Delete(int id)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                await _companyService.DeleteAsync(id);
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "DeleteCompany",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Deleted company with ID: {id}",
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
                    ActionType = "DeleteCompany",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"Error deleting company with ID: {id}",
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

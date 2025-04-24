using Microsoft.AspNetCore.Mvc;
using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Domain;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace VSFrontendBackend.Server.Controllers
{
    [ApiController]
    [Route("company")]
    public class CompanyController : ControllerBase
    {
        private readonly ICompanyService _companyService;
        private static int _instanceCount = 0;
        private readonly int _instanceId;

        public CompanyController(ICompanyService companyService)
        {
            _instanceId = Interlocked.Increment(ref _instanceCount);
            _companyService = companyService;
        }

        [HttpGet(Name = "CompanyData")]
        public async Task<IEnumerable<Company>> Get([FromQuery] FilterSortingCompaniesParams filterSortingCompaniesParams)
        {
            if (filterSortingCompaniesParams == null)
                filterSortingCompaniesParams = new FilterSortingCompaniesParams();

            return await _companyService.GetAllAsync(filterSortingCompaniesParams);
        }

        [HttpGet("{id}", Name = "GetCompanyById")]
        public async Task<Company> Get(int id)
        {
            return await _companyService.GetByIdAsync(id);
        }

        [HttpPost(Name = "ModifyCompany")]
        public async Task<IActionResult> Post(Company company)
        {
            var result = await _companyService.ModifyAsync(company);
            return Ok(result);
        }

        [HttpDelete("{id}", Name = "DeleteCompany")]
        public async Task<IActionResult> Delete(int id)
        {
            await _companyService.DeleteAsync(id);
            return Ok(id);
        }
    }
}

using System.Diagnostics;
using VSFrontendBackend.Server.Controllers;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Repository;

namespace VSFrontendBackend.Server.Services;

public interface ICompanyService
{
    Task<IEnumerable<Company>> GetAllAsync(FilterSortingCompaniesParams filterSortingCompaniesParams);
    Task<Company> GetByIdAsync(int id);
    Task<Company> ModifyAsync(Company company);
    Task DeleteAsync(int id);
}

public class CompanyService : ICompanyService
{
    private readonly ICompanyRepository _companyRepository;

    public CompanyService(ICompanyRepository companyRepository)
    {
        _companyRepository = companyRepository;
    }

    public async Task<IEnumerable<Company>> GetAllAsync(FilterSortingCompaniesParams filterSortingCompaniesParams)
    {
        List<Company> companies = await _companyRepository.GetAllAsync();

        if (!string.IsNullOrEmpty(filterSortingCompaniesParams.SearchText))
        {
            companies = companies.Where(c => 
                c.CompanyName.Contains(filterSortingCompaniesParams.SearchText, StringComparison.OrdinalIgnoreCase) ||
                c.Description.Contains(filterSortingCompaniesParams.SearchText, StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        if (filterSortingCompaniesParams.SortBy == "companyName")
        {
            companies = filterSortingCompaniesParams.Ascending
                ? companies.OrderBy(c => c.CompanyName).ToList()
                : companies.OrderByDescending(c => c.CompanyName).ToList();
        }
        else if (filterSortingCompaniesParams.SortBy == "netWorth")
        {
            companies = filterSortingCompaniesParams.Ascending
                ? companies.OrderBy(c => c.NetWorth).ToList()
                : companies.OrderByDescending(c => c.NetWorth).ToList();
        }

        return companies;
    }

    public async Task<Company> GetByIdAsync(int id)
    {
        return await _companyRepository.GetByIdAsync(id);
    }

    private bool IsValid(Company company)
    {
        if (company.Id <= 0)
            return false;

        if (string.IsNullOrEmpty(company.CompanyName))
            return false;

        if (company.NetWorth < 0)
            return false;

        if (string.IsNullOrEmpty(company.LogoID))
            return false;

        if (string.IsNullOrEmpty(company.Description))
            return false;

        return true;
    }

    public async Task<Company> ModifyAsync(Company company)
    {
        Debug.WriteLine(company);

        if (!IsValid(company))
            return Company.emptyCompany;

        // if the company already exists, update it, otherwise add it
        var existingCompany = await _companyRepository.GetByIdAsync(company.Id);
        if (existingCompany != Company.emptyCompany)
        {
            return await _companyRepository.UpdateAsync(company);
        }
        else
        {
            Debug.WriteLine("add");
            return await _companyRepository.AddAsync(company);
        }
    }

    public async Task DeleteAsync(int id)
    {
        await _companyRepository.DeleteAsync(id);
    }
}

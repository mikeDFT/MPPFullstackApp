using Microsoft.EntityFrameworkCore;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Utils;

namespace VSFrontendBackend.Server.Repository;

public interface ICompanyRepository
{
	Task<List<Company>> GetAllAsync();
	Task<Company> GetByIdAsync(int id);
	Task<Company> AddAsync(Company company);
	Task<Company> UpdateAsync(Company company);
	Task DeleteAsync(int id);
}

public class CompanyRepository : ICompanyRepository
{
	private readonly AppDbContext _context;
	public List<Company> CachedCompanies { get; set; } = new List<Company>();

    public CompanyRepository(AppDbContext context)
	{
		_context = context;
	}

	public async Task<List<Company>> GetAllAsync()
	{
		CachedCompanies = await _context.Companies.Include(c => c.Games).ToListAsync();
		return CachedCompanies;
    }

	public async Task<Company> GetByIdAsync(int id)
	{
		var company = await _context.Companies
			.Include(c => c.Games)
			.FirstOrDefaultAsync(c => c.Id == id);
			
		return company ?? Company.emptyCompany;
	}

	public async Task<Company> AddAsync(Company company)
	{
		await _context.Companies.AddAsync(company);
		await _context.SaveChangesAsync();
		return company;
	}

	public async Task<Company> UpdateAsync(Company company)
	{
		_context.Companies.Update(company);
		await _context.SaveChangesAsync();
		return company;
	}

	public async Task DeleteAsync(int id)
	{
		var company = await _context.Companies.FindAsync(id);
		if (company != null)
		{
			_context.Companies.Remove(company);
			await _context.SaveChangesAsync();
		}
	}
}

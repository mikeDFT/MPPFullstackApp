using VSFrontendBackend.Server.Domain;

namespace VSFrontendBackend.Server.Repository
{
	public interface ICompanyRepository
	{
		List<Company> GetAllAsync();
		Company GetByIdAsync(int id);
		Company AddAsync(Company company);
		Company UpdateAsync(Company company);
		void DeleteAsync(int id);
	}

	public class CompanyRepository
	{
		private static List<Company> _companies = [

		];

		public List<Company> GetAllAsync()
		{
			return _companies;
		}

		public Company GetByIdAsync(int id)
		{
			var index = _companies.FindIndex(g => g.Id == id);
			if (index != -1)
			{
				return _companies[index];
			}

			return Company.emptyCompany;
		}

		public Company AddAsync(Company company)
		{
			_companies.Add(company);
			return company;
		}

		public Company UpdateAsync(Company company)
		{
			var index = _companies.FindIndex(g => g.Id == company.Id);
			if (index != -1)
			{
				_companies[index] = company;
			}
			return company;
		}

		public void DeleteAsync(int id)
		{
			_companies.RemoveAll(g => g.Id == id);
		}
	}
}

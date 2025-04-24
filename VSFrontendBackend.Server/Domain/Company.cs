namespace VSFrontendBackend.Server.Domain
{
    public class Company
    {
        // parameterless constructor for Entity Framework
        public Company()
        {
            Games = new List<Game>();
        }

        public Company(int id, string companyName, int netWorth, string logoID, string description)
        {
            Id = id;
            CompanyName = companyName;
            NetWorth = netWorth;
            LogoID = logoID;
            Description = description;
            Games = new List<Game>();
        }

        public static readonly Company emptyCompany = new Company(-1, "", 0, "", "");

        public int Id { get; set; } = -1;
        public string CompanyName { get; set; } = "";
        public int NetWorth { get; set; } = 0;
        public string LogoID { get; set; } = "";
        public string Description { get; set; } = "";
        public ICollection<Game> Games { get; set; }
    }
}

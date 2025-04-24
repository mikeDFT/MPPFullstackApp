namespace VSFrontendBackend.Server.Domain
{   
    public class Game
    {
        // Default constructor for object initializer syntax
        public Game()
        {
            // Initialize collections to prevent null reference exceptions
            Genres = new List<string>();
            Platforms = new List<string>();
        }

        // Constructor with parameters for backward compatibility
        public Game(int id, Company? company, string name, string iconID, double price, double rating, string description, List<string> genres, List<string> platforms)
        {
            Id = id;
            CompanyID = company?.Id ?? -1; // FK
            Name = name;
            IconID = iconID;
            Price = price;
            Rating = rating;
            Description = description;
            Genres = genres ?? new List<string>();
            Platforms = platforms ?? new List<string>();

            this.Company = company ?? Company.emptyCompany;
        }

        public static readonly Game emptyGame = new Game(-1, null, "", "", 0, 0, "", [], []);

        public int Id { get; set; } = -1;
        public int CompanyID { get; set; } = -1; // FK
        public Company Company { get; set; }     // Navigation property
        public string Name { get; set; } = "";
        public string IconID { get; set; } = "";
        public double Price { get; set; } = 1;
        public double Rating { get; set; } = 1;
        public string Description { get; set; } = "";
        public List<string> Genres { get; set; }
        public List<string> Platforms { get; set; }
    }
}


// { // from the frontend:
// 		ID: getRndGameID(gamesList),
// 		Name: generateGameName(),
// 		IconID: getRndIconID(),
// 		Price: Math.floor(Math.random() * 60) + 0.99,
// 		Rating: Number((Math.floor(Math.random() * 10) / 10 * 4.5 + 1).toFixed(1)), // sometimes floating point precision is like "1.7000000004", so I fix it to 1 decimal place
// 		Description: "Epic game where you do this and that and something else and you can (probably) do it with your friends or alone and also lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
// 		Genres: selectedGenres,
// 		Platforms: selectedPlatforms
// 	};
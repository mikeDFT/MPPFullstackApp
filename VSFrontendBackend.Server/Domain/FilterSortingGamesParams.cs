namespace VSFrontendBackend.Server.Domain;

public class FilterSortingGamesParams
{
    public string? SearchText { get; set; }
    public List<string>? Genres { get; set; }
    public List<string>? Platforms { get; set; }
    public string? SortBy { get; set; }  // "price", "rating", "name"
    public bool Ascending { get; set; }
    public string? CompanySearchText { get; set; }
}
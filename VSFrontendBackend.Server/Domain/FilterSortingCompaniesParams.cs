namespace VSFrontendBackend.Server.Domain;

public class FilterSortingCompaniesParams
{
    public string? SortBy { get; set; } = "name";
    public bool Ascending { get; set; } = true;
    public string? SearchText { get; set; } = "";
}
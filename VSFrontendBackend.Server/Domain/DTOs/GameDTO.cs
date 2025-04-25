using System.ComponentModel.Design;

namespace VSFrontendBackend.Server.Domain.DTOs;

public class GameDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public string IconID { get; set; } = string.Empty;
    public double Rating { get; set; }
    public List<string> Genres { get; set; } = new List<string>();
    public List<string> Platforms { get; set; } = new List<string>();
    public int CompanyID { get; set; }
    public string CompanyName { get; set; } = string.Empty;

    // Convert from domain entity to DTO
    public static GameDTO FromGame(Game game)
    {
        return new GameDTO
        {
            Id = game.Id,
            Name = game.Name,
            Price = game.Price,
            Description = game.Description,
            IconID = game.IconID,
            Rating = game.Rating,
            Genres = game.Genres,
            Platforms = game.Platforms,
            CompanyID = game.Company?.Id ?? 0,
            CompanyName = game.Company?.CompanyName ?? string.Empty
        };
    }

    // Convert from DTO to domain entity
    public Game ToGame()
    {
        return new Game
        {
            Id = Id,
            Name = Name,
            Price = Price,
            Description = Description,
            IconID = IconID,
            Rating = Rating,
            Genres = Genres,
            Platforms = Platforms,
            CompanyID = CompanyID
        };
    }

    // Convert a list of Game entities to a list of DTOs
    public static List<GameDTO> FromGameList(List<Game> games)
    {
        return games.Select(g => FromGame(g)).ToList();
    }
}

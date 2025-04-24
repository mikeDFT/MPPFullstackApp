using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VSFrontendBackend.Server.Models;

namespace VSFrontendBackend.Server.Utils
{
    public class GameDataGenerator
    {
        // Game name prefixes for random generation
        private static readonly string[] NamePrefixes = new string[]
        {
            "Super", "Epic", "Dark", "Light", "Eternal", "Mystic",
            "Magic", "Tech", "Cyber", "Retro", "Future", "Ancient",
            "Deadly", "Cosmic", "Stellar", "Hyper", "Mega", "Ultra", 
            "Quantum", "Neon", "Pixel", "Astral", "Phantom", "Solar",
            "Lunar", "Divine", "Infernal", "Frozen", "Blazing", "Thunder",
            "Shadow", "Radiant", "Savage", "Primal", "Digital", "Fabled",
            "Rogue", "Golden", "Crystal", "Dragon", "Stealth", "Chaos",
            "Void", "Emerald", "Ruby", "Sapphire", "Iron", "Midnight"
        };

        // Game name suffixes for random generation
        private static readonly string[] NameSuffixes = new string[]
        {
            "Quest", "Adventure", "Journey", "Legend", "Tales", "Chronicles",
            "Saga", "Hero", "Kingdom", "Realm", "World", "Lands",
            "Warriors", "Masters", "Conqueror", "Odyssey", "Dungeons", "Depths",
            "Fortress", "Dynasty", "Empire", "Legends", "Titans", "Guardians",
            "Hunters", "Knights", "Wizards", "Explorers", "Raiders", "Frontiers",
            "Horizons", "Dimensions", "Infinity", "Ascension", "Battle", "War",
            "Tycoon", "Simulator", "Survival", "Commander", "Tactics", "Defense",
            "Rebellion", "Revolution", "Escape", "Rescue", "Assault", "Siege",
            "Trials", "Mysteries", "Secrets", "Legacy", "Dawn", "Dusk", "Nexus"
        };

        // Default platforms and genres
        private static readonly string[] DefaultPlatforms = new string[]
        {
            "PC", "Xbox", "PlayStation", "Nintendo Switch", "Mobile"
        };

        private static readonly string[] DefaultGenres = new string[]
        {
            "Action", "Adventure", "RPG", "Strategy", "Simulation", "Sports",
            "Racing", "Puzzle", "Platformer", "Fighting", "Shooter", "Horror",
            "Educational", "Music", "Party", "Roguelike", "Sandbox", "Survival"
        };

        private static readonly List<string> randomIconIds = new List<string>
        {
            //"",
            "ROR2Icon",
            "DBDIcon",
            "Portal2Icon",
            "DeadCellsIcon",
            "NMSIcon",
            "AmogusIcon",
            "DuolingoIcon",
            "DarkNDIcon",
            "DeathsDoorIcon",
            "KillKnightIcon",
            "LethalCompIcon",
            "REPOIcon",
            "SuperHotIcon",
            "PalworldIcon",
            "SlayTheSpireIcon",
            "BPMIcon"
        };

        private static readonly Random Random = new Random();

        private static string GetRandomIconId()
        {
            return randomIconIds[Random.Next(randomIconIds.Count)];
        }

        private static int GetRandomGameId(List<Game> gamesList)
        {
            int rndGameId;
            do
            {
                rndGameId = Random.Next(1, 1000000);
            } while (gamesList.Any(game => game.Id == rndGameId));

            return rndGameId;
        }

        private static string GenerateGameName()
        {
            string prefix = NamePrefixes[Random.Next(NamePrefixes.Length)];
            string suffix = NameSuffixes[Random.Next(NameSuffixes.Length)];
            return $"{prefix} {suffix}";
        }

        // Gets a random number of items between min and max from the given array
        private static List<string> GetRandomItems(string[] array, int min = 1, int max = 3)
        {
            int count = Random.Next(min, max + 1);
            return array.OrderBy(x => Random.Next()).Take(count).ToList();
        }

        public static Game GenerateGameData(List<Game> gamesList)
        {
            var selectedGenres = GetRandomItems(DefaultGenres, 2, 4);
            var selectedPlatforms = GetRandomItems(DefaultPlatforms, 2, 4);

            return new Game
            {
                Id = GetRandomGameId(gamesList),
                Name = GenerateGameName(),
                IconID = GetRandomIconId(),
                Price = Math.Round(Random.NextDouble() * 60 + 0.99, 2),
                Rating = Math.Round(Random.NextDouble() * 4.5 + 0.5, 1),
                Description = "Epic game where you do this and that and something else and you can (probably) do it with your friends or alone and also lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                Genres = selectedGenres,
                Platforms = selectedPlatforms
            };
        }

        public static List<Game> GenerateGames(int count, List<Game> existingGames)
        {
            var gamesList = new List<Game>(existingGames);
            for (int i = 0; i < count; i++)
            {
                gamesList.Add(GenerateGameData(gamesList));
            }
            return gamesList;
        }
    }
}

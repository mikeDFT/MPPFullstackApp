using System;
using System.Collections.Generic;
using System.Linq;
using VSFrontendBackend.Server.Domain;

namespace VSFrontendBackend.Server.Utils
{
    public class CompanyDataGenerator
    {
        // Company name prefixes for random generation
        private static readonly string[] NamePrefixes = new string[]
        {
            "Advanced", "Alpha", "Apex", "Astro", "Atomic", "Aura", 
            "Binary", "Byte", "Blue", "Bright", "Blizzard", "Bolt",
            "Cyber", "Core", "Cosmic", "Crest", "Catalyst", "Crystal",
            "Digi", "Dynamo", "Delta", "Dawn", "Dream", "Diamond",
            "Echo", "Electra", "Edge", "Epic", "Evolve", "Ember",
            "Fusion", "Frontier", "Future", "Forge", "Flash", "Focal",
            "Global", "Genesis", "Giga", "Galaxy", "Gravity", "Gear",
            "Hyper", "Horizon", "Helios", "Hex", "Harbor", "Halo",
            "Infinite", "Ion", "Impulse", "Imagine", "Insight", "Iris",
            "Jade", "Jupiter", "Jet", "Junction", "Jewel", "Journey"
        };

        // Company name suffixes for random generation
        private static readonly string[] NameSuffixes = new string[]
        {
            "Games", "Studios", "Interactive", "Entertainment", "Digital", "Media",
            "Tech", "Systems", "Innovations", "Solutions", "Software", "Productions",
            "Gaming", "Ventures", "Creations", "Arts", "Dynamics", "Networks",
            "Pixels", "Labs", "Development", "Designs", "Group", "Team",
            "Works", "Forge", "Industries", "Visuals", "Technologies", "Concepts"
        };

        // Company descriptions
        private static readonly string[] CompanyDescriptions = new string[]
        {
            "A pioneering game development studio known for creating innovative gameplay experiences across multiple platforms.",
            "Specializing in immersive open-world games with stunning visuals and compelling narratives.",
            "Creating award-winning indie games with unique art styles and innovative mechanics.",
            "A veteran studio with decades of experience creating beloved gaming franchises.",
            "Pushing the boundaries of technology to deliver next-generation gaming experiences.",
            "Focused on narrative-driven adventures that challenge conventional gaming paradigms.",
            "Known for highly polished strategy games with deep mechanics and extensive replayability.",
            "A studio dedicated to revitalizing classic genres with modern design sensibilities.",
            "Creating accessible yet deep gaming experiences for players of all skill levels.",
            "Specializing in multiplayer experiences that bring communities together.",
            "Crafting meticulously detailed simulation games with authentic systems and mechanics.",
            "An emerging studio focused on experimental gameplay and innovative control schemes.",
            "Founded by industry veterans with a passion for creating unforgettable game worlds.",
            "Developing platform-exclusive titles that showcase cutting-edge hardware capabilities.",
            "Known for extensive post-launch support and engaging with player communities."
        };

        // Logo IDs
        private static readonly List<string> randomLogoIds = new List<string>
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

        private static string GetRandomLogoId()
        {
            return randomLogoIds[Random.Next(randomLogoIds.Count)];
        }

        private static int GetRandomCompanyId(List<Company> companiesList)
        {
            int rndCompanyId;
            do
            {
                rndCompanyId = Random.Next(1, 1000000);
            } while (companiesList.Any(company => company.Id == rndCompanyId));

            return rndCompanyId;
        }

        private static string GenerateCompanyName()
        {
            string prefix = NamePrefixes[Random.Next(NamePrefixes.Length)];
            string suffix = NameSuffixes[Random.Next(NameSuffixes.Length)];
            return $"{prefix} {suffix}";
        }

        public static Company GenerateCompanyData(List<Company> companiesList)
        {
            return new Company(
                id: GetRandomCompanyId(companiesList),
                companyName: GenerateCompanyName(),
                netWorth: Random.Next(1, 100) * 1000000,
                logoID: GetRandomLogoId(),
                description: CompanyDescriptions[Random.Next(CompanyDescriptions.Length)]
            );
        }

        public static List<Company> GenerateCompanies(int count, List<Company> existingCompanies)
        {
            var companiesList = new List<Company>(existingCompanies);
            for (int i = 0; i < count; i++)
            {
                companiesList.Add(GenerateCompanyData(companiesList));
            }
            return companiesList;
        }
    }
}

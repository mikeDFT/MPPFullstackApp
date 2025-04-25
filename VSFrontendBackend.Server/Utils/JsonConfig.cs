using System.Text.Json;
using System.Text.Json.Serialization;

namespace VSFrontendBackend.Server.Utils
{
    public static class JsonConfig
    {
        public static JsonSerializerOptions DefaultOptions => new JsonSerializerOptions
        {
            // Disable reference handling to remove $id and $values properties
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }
}

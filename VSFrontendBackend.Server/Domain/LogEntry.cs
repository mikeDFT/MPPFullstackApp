
namespace VSFrontendBackend.Server.Domain
{
    /// <summary>
    /// Represents a log entry for tracking actions and requests in the system
    /// </summary>
    public class LogEntry
    {
        /// <summary>
        /// Gets or sets the unique identifier for this log entry
        /// </summary>
        public Guid Id { get; set; } = Guid.NewGuid();
        
        /// <summary>
        /// Gets or sets when the action/request happened (e.g., 2025-04-25T12:34:56Z)
        /// </summary>
        public DateTime Timestamp { get; private set; } = DateTime.UtcNow;
        
        /// <summary>
        /// Gets or sets what kind of action happened (e.g., "NewGame", "UpdateCompany", "WebSocketMessage")
        /// </summary>
        public string ActionType { get; set; } = "Not provided";
        
        /// <summary>
        /// Gets or sets the endpoint for REST requests (e.g., POST /api/games)
        /// </summary>
        public string RequestPath { get; set; } = "Not provided";
        
        /// <summary>
        /// Gets or sets a summary of what was sent or received (e.g., JSON payload, potentially trimmed)
        /// </summary>
        public string Message { get; set; } = "Not provided";
        
        /// <summary>
        /// Gets or sets where the request came from (important for audit trails)
        /// </summary>
        public string ClientIpAddress { get; set; } = "Not provided";
        
        /// <summary>
        /// Gets or sets whether the request was successful, failed, etc. (e.g., 200 OK, 500 Error)
        /// </summary>
        public string Status { get; set; } = "Not provided";
        
        /// <summary>
        /// Gets or sets how long the request took to process in milliseconds
        /// </summary>
        public long DurationMs { get; set; }
        
        /// <summary>
        /// Gets or sets the WebSocket connection ID that sent the message (if applicable)
        /// </summary>
        public string ConnectionId { get; set; } = "Not provided";
        
        /// <summary>
        /// Gets or sets the exception message and stack trace if an error occurred
        /// </summary>
        public string Errors { get; set; } = "Not provided";
        
        /// <summary>
        /// Gets or sets additional contextual information that doesn't fit elsewhere
        /// </summary>
        public string AdditionalInfo { get; set; } = "Not provided";
    }
}

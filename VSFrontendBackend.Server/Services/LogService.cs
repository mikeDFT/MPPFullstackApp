using System.Diagnostics;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Repository;

namespace VSFrontendBackend.Server.Services
{
    public interface ILogService
    {
        Task<List<LogEntry>> GetAllLogsAsync();
        Task<LogEntry> GetLogByIdAsync(Guid id);
        Task<LogEntry> LogActionAsync(LogEntry logEntry);
        Task<List<LogEntry>> GetRecentLogsAsync(int count);
        Task<List<LogEntry>> GetLogsByActionTypeAsync(string actionType);
        Task ClearLogsAsync();
    }

    public class LogService : ILogService
    {
        private readonly ILogRepository _logRepository;

        public LogService(ILogRepository logRepository)
        {
            _logRepository = logRepository;
        }

        public async Task<List<LogEntry>> GetAllLogsAsync()
        {
            return await _logRepository.GetAllAsync();
        }

        public async Task<LogEntry> GetLogByIdAsync(Guid id)
        {
            return await _logRepository.GetByIdAsync(id);
        }

        public async Task<LogEntry> LogActionAsync(LogEntry logEntry)
        {
            Debug.WriteLine($"Logging action: {logEntry.ActionType}, Path: {logEntry.RequestPath}");
            
            // Ensure timestamp is set to current time
            if (logEntry.Id == Guid.Empty)
            {
                logEntry.Id = Guid.NewGuid();
            }
            
            return await _logRepository.AddAsync(logEntry);
        }

        public async Task<List<LogEntry>> GetRecentLogsAsync(int count)
        {
            return await _logRepository.GetRecentLogsAsync(count);
        }

        public async Task<List<LogEntry>> GetLogsByActionTypeAsync(string actionType)
        {
            return await _logRepository.GetLogsByActionTypeAsync(actionType);
        }

        public async Task ClearLogsAsync()
        {
            await _logRepository.ClearLogsAsync();
        }
    }
}

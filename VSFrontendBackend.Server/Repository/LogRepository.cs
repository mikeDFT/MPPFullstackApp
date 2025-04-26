using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Utils;

namespace VSFrontendBackend.Server.Repository
{
    public interface ILogRepository
    {
        Task<List<LogEntry>> GetAllAsync();
        Task<LogEntry> GetByIdAsync(Guid id);
        Task<LogEntry> AddAsync(LogEntry logEntry);
        Task<List<LogEntry>> GetRecentLogsAsync(int count);
        Task<List<LogEntry>> GetLogsByActionTypeAsync(string actionType);
        Task ClearLogsAsync();
    }

    public class LogRepository : ILogRepository
    {
        private readonly AppDbContext _context;

        public LogRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<LogEntry>> GetAllAsync()
        {
            return await _context.LogEntries.OrderByDescending(l => l.Timestamp).ToListAsync();
        }

        public async Task<LogEntry> GetByIdAsync(Guid id)
        {
            var logEntry = await _context.LogEntries.FindAsync(id);
            return logEntry;
        }

        public async Task<LogEntry> AddAsync(LogEntry logEntry)
        {
            Debug.WriteLine($"Adding log entry: {logEntry.ActionType}");
            
            await _context.LogEntries.AddAsync(logEntry);
            await _context.SaveChangesAsync();
            return logEntry;
        }

        public async Task<List<LogEntry>> GetRecentLogsAsync(int count)
        {
            return await _context.LogEntries
                .OrderByDescending(l => l.Timestamp)
                .Take(count)
                .ToListAsync();
        }

        public async Task<List<LogEntry>> GetLogsByActionTypeAsync(string actionType)
        {
            return await _context.LogEntries
                .Where(l => l.ActionType == actionType)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();
        }

        public async Task ClearLogsAsync()
        {
            _context.LogEntries.RemoveRange(_context.LogEntries);
            await _context.SaveChangesAsync();
        }
    }
}

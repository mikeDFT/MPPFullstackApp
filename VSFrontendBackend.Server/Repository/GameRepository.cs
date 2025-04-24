using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Utils;

namespace VSFrontendBackend.Server.Repository;

public interface IGameRepository
{
    Task<List<Game>> GetAllAsync();
    Task<Game> GetByIdAsync(int id);
    Task<Game> AddAsync(Game game);
    Task<Game> UpdateAsync(Game game);
    Task DeleteAsync(int id);
}

public class GameRepository : IGameRepository
{
    private readonly AppDbContext _context;

    public GameRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Game>> GetAllAsync()
    {
        return await _context.Games.Include(g => g.Company).ToListAsync();
    }

    public async Task<Game> GetByIdAsync(int id)
    {
        var game = await _context.Games
            .Include(g => g.Company)
            .FirstOrDefaultAsync(g => g.Id == id);
            
        return game ?? Game.emptyGame;
    }

    public async Task<Game> AddAsync(Game game)
    {
        Debug.WriteLine("ADDING GAME");
        
        // For new games, ensure ID is 0 so the database will auto-generate it
        if (game.Id != 0)
        {
            game.Id = 0;
        }
        
        await _context.Games.AddAsync(game);
        await _context.SaveChangesAsync();
        return game;
    }

    public async Task<Game> UpdateAsync(Game game)
    {
        Debug.WriteLine("UPDATING GAME");
        
        // Detach any existing entity with the same ID to prevent tracking conflicts
        var existingEntity = await _context.Games.FindAsync(game.Id);
        if (existingEntity != null)
        {
            _context.Entry(existingEntity).State = EntityState.Detached;
        }
        
        // Attach and mark as modified
        _context.Entry(game).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return game;
    }
    
    public async Task DeleteAsync(int id)
    {
        var game = await _context.Games.FindAsync(id);
        if (game != null)
        {
            _context.Games.Remove(game);
            await _context.SaveChangesAsync();
        }
    }
}
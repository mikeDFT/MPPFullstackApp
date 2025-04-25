using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using VSFrontendBackend.Server.Domain;

namespace VSFrontendBackend.Server.Utils
{
    public class AppDbContext : DbContext
    {
        public DbSet<Game> Games { get; set; }
        public DbSet<Company> Companies { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure the relationship
            modelBuilder.Entity<Game>()
                .HasOne(game => game.Company)
                .WithMany(company => company.Games)
                .HasForeignKey(game => game.CompanyID)
                .IsRequired(false)  // Make FK optional
                .OnDelete(DeleteBehavior.SetNull);  // Change to SetNull instead of Cascade
        }
    }
}

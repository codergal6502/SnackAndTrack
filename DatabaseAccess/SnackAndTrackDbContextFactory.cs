using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SnackAndTrack.DatabaseAccess {
    internal class SnackAndTrackDbContextFactory : IDesignTimeDbContextFactory<SnackAndTrackDbContext>
    {
        public SnackAndTrackDbContext CreateDbContext(string[] args)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.Development.json")
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<SnackAndTrackDbContext>();
            var connectionString = configuration.GetConnectionString("PSQLConnection");

            optionsBuilder.UseNpgsql(connectionString);

            var ctor = typeof(SnackAndTrackDbContext).GetConstructor([typeof(DbContextOptions<SnackAndTrackDbContext>)]) ?? throw new Exception("No options constructor.");

            return (SnackAndTrackDbContext) ctor.Invoke([optionsBuilder.Options]);
        }
    }
}
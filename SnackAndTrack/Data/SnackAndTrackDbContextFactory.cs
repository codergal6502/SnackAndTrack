using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.Data;

namespace SnackAndTrack.Data {
    public class SnackAndTrackDbContextFactory : Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<SnackAndTrackDbContext>
    {
        public SnackAndTrackDbContext CreateDbContext(string[] args = null)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.Development.json")
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<SnackAndTrackDbContext>();
            var connectionString = configuration.GetConnectionString("PSQLConnection");

            optionsBuilder.UseNpgsql(connectionString);

            return new SnackAndTrackDbContext(optionsBuilder.Options);
        }
    }
}

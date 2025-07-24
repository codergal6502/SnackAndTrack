using Microsoft.EntityFrameworkCore;
using SnackAndTrack.Models;

namespace SnackAndTrack.Data {
    public class SnackAndTrackDbContext : DbContext {
        public SnackAndTrackDbContext(DbContextOptions<SnackAndTrackDbContext> options) : base(options) {

        }

        public DbSet<FoodItem> FoodItems { get; set; }
    }
}
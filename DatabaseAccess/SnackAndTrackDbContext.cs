using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.DatabaseAccess {
    public class SnackAndTrackDbContext : DbContext {
        public SnackAndTrackDbContext(DbContextOptions<SnackAndTrackDbContext> options) : base(options) { }

        public required DbSet<FoodItem> FoodItems { get; set; }
        public required DbSet<FoodItemNutrient> FoodItemNutrients { get; set; }
        public required DbSet<Nutrient> Nutrients { get; set; }
        public required DbSet<Unit> Units { get; set; }
        public required DbSet<UnitConversion> UnitConversions { get; set; }
        public required DbSet<ServingSize> ServingSizes { get; set; }
    }
}
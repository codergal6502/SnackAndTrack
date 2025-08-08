using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.DatabaseAccess {
    public class SnackAndTrackDbContext : DbContext
    {
        public SnackAndTrackDbContext(DbContextOptions<SnackAndTrackDbContext> options) : base(options) { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // optionsBuilder.UseLazyLoadingProxies();
            base.OnConfiguring(optionsBuilder);
        }

        public required DbSet<FoodItem> FoodItems { get; set; }
        public required DbSet<FoodItemNutrient> FoodItemNutrients { get; set; }
        public required DbSet<Nutrient> Nutrients { get; set; }
        public required DbSet<Unit> Units { get; set; }
        public required DbSet<UnitConversion> UnitConversions { get; set; }
        public required DbSet<ServingSize> ServingSizes { get; set; }
        public required DbSet<Recipe> Recipes { get; set; }
        public required DbSet<RecipeIngredient> RecipeIngredients { get; set; }
        public required DbSet<NutritionGoalSet> NutritionGoalSets { get; set; }
        public required DbSet<NutritionGoalSetDayMode> NutritionGoalSetDayModes { get; set; }
        public required DbSet<NutritionGoalSetNutrient> NutritionGoalSetNutrients { get; set; }
        public required DbSet<NutritionGoalSetNutrientTarget> NutritionGoalSetNutrientTargets { get; set; }
        public required DbSet<FoodJournalEntry> FoodJournalEntries { get; set; }
    }
}
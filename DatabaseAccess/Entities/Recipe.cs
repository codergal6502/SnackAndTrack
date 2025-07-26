
namespace SnackAndTrack.DatabaseAccess.Entities {
    public class Recipe
    {
        public required Guid Id { get; set; }
        public required String Name { get; set; }
        public String? Source { get; set; }
        public required ICollection<RecipeIngredient> RecipeIngredients { get; set; }
    }
}
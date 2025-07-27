
namespace SnackAndTrack.DatabaseAccess.Entities {
    public class Recipe
    {
        public virtual required Guid Id { get; set; }
        public virtual required String Name { get; set; }
        public virtual String? Source { get; set; }
        public virtual required ICollection<RecipeIngredient> RecipeIngredients { get; set; }
    }
}
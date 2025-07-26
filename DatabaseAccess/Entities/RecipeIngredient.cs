
namespace SnackAndTrack.DatabaseAccess.Entities {
    public class RecipeIngredient
    {
        public required Guid Id { get; set; }
        public required Recipe Recipe { get; set; }
        public required FoodItem FoodItem { get; set; }
        public required Unit Unit { get; set; }
        public required Single Quantity { get; set; }
        public required Int16 DisplayOrder { get; set; }
    }
}
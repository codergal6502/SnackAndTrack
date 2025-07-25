namespace SnackAndTrack.DatabaseAccess.Entities {
    public class FoodItemNutrient { 
        public required Guid Id { get; set; }
        public required FoodItem FoodItem { get; set; }
        public required Nutrient Nutrient { get; set; }
        public required Single Quantity { get; set; }
    }
}
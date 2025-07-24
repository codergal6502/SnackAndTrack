namespace SnackAndTrack.Models {
    public class Nutrient {
        public required Guid Id { get; set; }
        public required String Name { get; set; }
        public required ICollection<FoodItemNutrient> FoodItemNutrients { get; set; }
    }
}
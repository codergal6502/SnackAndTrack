namespace SnackAndTrack.DatabaseAccess.Entities {
    public class Nutrient {
        public Nutrient() { FoodItemNutrients = []; }
        public required Guid Id { get; set; }
        public required String Name { get; set; }
        public required ICollection<FoodItemNutrient> FoodItemNutrients { get; set; }
    }
}
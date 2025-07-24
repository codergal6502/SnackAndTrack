namespace SnackAndTrack.DatabaseAccess.Entities {
    public class FoodItem {
        public required Guid Id { get; set; }
        public required String Name  { get; set; }
        public required String Brand { get; set; }
        public required ICollection<FoodItemNutrient> FoodItemNutrients { get; set; }
        public required ICollection<ServingSize> ServingSizes { get; set; }
    }
}
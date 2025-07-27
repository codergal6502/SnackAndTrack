namespace SnackAndTrack.DatabaseAccess.Entities {
    public class Nutrient {
        public virtual required Guid Id { get; set; }
        public virtual required String Name { get; set; }
        public virtual required ICollection<FoodItemNutrient> FoodItemNutrients { get; set; }
    }
}
namespace SnackAndTrack.DatabaseAccess.Entities {
    public class FoodItemNutrient { 
        public virtual required Guid Id { get; set; }
        public virtual required FoodItem FoodItem { get; set; }
        public virtual required Nutrient Nutrient { get; set; }
        public virtual required Single Quantity { get; set; }
        public virtual required Int16 DisplayOrder { get; set; }
    }
}
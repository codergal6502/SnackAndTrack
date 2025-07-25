namespace SnackAndTrack.DatabaseAccess.Entities {
    public class ServingSize
    {
        public required Guid Id { get; set; }
        public required Unit Unit { get; set; }
        public required Single Quantity { get; set; }
        public required FoodItem FoodItem { get; set; }
    }
}
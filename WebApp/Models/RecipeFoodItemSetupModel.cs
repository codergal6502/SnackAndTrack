namespace SnackAndTrack.WebApp.Models {
    public class RecipeFoodItemSetupModel { 
        public required Guid RecipeId { get; set; }
        public class ServingSizeConversion {
            public required Guid UnitId { get; set; }
            public required Single Quantity { get; set; }
        }
        public required ServingSizeConversion[] ServingSizeConversions { get; set; }
    }
}
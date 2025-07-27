namespace SnackAndTrack.WebApp.Models {
    public class RecipeModel {
        public Guid Id { get; set; }
        public required String Name { get; set; }
        public String? Source { get; set; }

        public required AmountMade[] AmountsMade { get; set; }

        public class AmountMade {
            public String? QuantityUnitType { get; set; }
            public String? QuantityUnitName { get; set; }
            public required Guid QuantityUnitId { get; set; }
            public required Single Quantity { get; set; }            
        }

        public required Ingredient[] Ingredients { get; set; }

        public class Ingredient { 
            public String? FoodItemName { get; set; }
            public required Guid FoodItemId { get; set; }
            public String? QuantityUnitType { get; set; }
            public String? QuantityUnitName { get; set; }
            public required Guid QuantityUnitId { get; set; }
            public required Single Quantity { get; set; }
            public String[]? QuantityUnitTypeOptions { get; set; }
        }
    }
}
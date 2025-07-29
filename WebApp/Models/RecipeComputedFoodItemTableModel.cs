namespace SnackAndTrack.WebApp.Models {
    public class RecipeComputedFoodItemTableModel {
            public class NutrientSummary
            {
                public required Guid NutrientId { get; set; }
                public required String NutrientName { get; set; }
                public required Single TotalQuantity { get; set; }
                public required String NutrientUnitName { get; set; }
                public required String NutrientUnitType { get; set; }
                public required Guid NutrientUnitId { get; set; }
                public required Int16 NutrientUnitDisplayOrder { get; set; }

                public required IList<FoodItemContribution> FoodItemContributions { get; set; }
                public required Single? PercentDailyValue { get; set; }

            public class FoodItemContribution
                {
                    public required Single? NutrientQuantity { get; set; }
                    public required String? NutrientUnitName { get; set; }
                    public required Guid? NutrientUnitId { get; set; }
                    public required String FoodItemName { get; set; }
                    public required Guid FoodItemId { get; set; }
                }
            }

            public required IList<NutrientSummary> NutrientSummaries { get; set; }
        }

}
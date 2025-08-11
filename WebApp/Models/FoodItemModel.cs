using System.ComponentModel;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.Models {
    public class FoodItemModel {
        public Guid? Id { get; set; }
        public required String Name { get; set; }
        public required String Brand { get; set; }
        public required Boolean UsableAsRecipeIngredient { get; set; }
        public required Boolean UsableInFoodJournal { get; set; }
        public required String? Notes { get; set; }
        public String? GeneratedFromName { get; set; }
        public Guid? GeneratedFromId { get; set; }
        public required Nutrient[] Nutrients { get; set; }
        public required ServingSize[] ServingSizes { get; set; }
        public DateOnly? RecipeBatchDate { get; set; }

        public class Nutrient
        {
            public required Guid NutrientId { get; set; }
            public required Guid? UnitId { get; set; }
            public required Single? Quantity { get; set; }
            public required Single? Percent { get; set; }
        }

        public class ServingSize {
            // optional for incoming requests; canonically it makes sense to have an input
            // model and an ouput model but that is way too tedious for no real benefit.
            public String? UnitType { get; set; }
            public required Guid UnitId { get; set; }
            public required Single Quantity { get; set; }
        }
    }
}
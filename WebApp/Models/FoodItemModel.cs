using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.Models {
    public class FoodItemModel {
        public Guid? Id { get; set; }
        public required String Name  { get; set; }
        public required String Brand { get; set; }
        public required Nutrient[] Nutrients { get; set; }

        public class Nutrient {
            public required String Name { get; set; }
            public required Int16 Quantity { get; set; }
        }
    }
}
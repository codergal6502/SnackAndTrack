using System.ComponentModel.DataAnnotations;

namespace SnackAndTrack.DatabaseAccess.Entities {
    public class Nutrient {
        [Key]
        public virtual required Guid Id { get; set; }
        public virtual required String Name { get; set; }
        public virtual required ICollection<FoodItemNutrient> FoodItemNutrients { get; set; }
    }
}
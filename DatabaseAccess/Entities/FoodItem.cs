using System.ComponentModel.DataAnnotations;

namespace SnackAndTrack.DatabaseAccess.Entities {
    public class FoodItem {
        [Key]
        public virtual required Guid Id { get; set; }
        public virtual required String Name  { get; set; }
        public virtual required String Brand { get; set; }
        public virtual required ICollection<FoodItemNutrient> FoodItemNutrients { get; set; }
        public virtual required ICollection<ServingSize> ServingSizes { get; set; }
    }
}
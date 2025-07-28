using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;

namespace SnackAndTrack.DatabaseAccess.Entities {
    [DebuggerDisplay("{Name}")]
    public class FoodItem {
        [Key]
        public virtual required Guid Id { get; set; }
        public virtual required String Name  { get; set; }
        public virtual required String Brand { get; set; }
        [ForeignKey(nameof(Recipe.GeneratedFoodItem))]
        public virtual Recipe? GeneratedFrom { get; set; }
        public virtual required ICollection<FoodItemNutrient> FoodItemNutrients { get; set; }
        public virtual required ICollection<ServingSize> ServingSizes { get; set; }
    }
}
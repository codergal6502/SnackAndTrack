using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;

namespace SnackAndTrack.DatabaseAccess.Entities
{
    [DebuggerDisplay("{Name}")]
    public class FoodItem
    {
        [Key]
        public virtual required Guid Id { get; set; }
        [MaxLength(200)]
        public virtual required String Name { get; set; }
        [MaxLength(200)]
        public virtual required String Brand { get; set; }
        public virtual required Boolean UsableAsRecipeIngredient { get; set; }
        public virtual required Boolean UsableInFoodJournal { get; set; }
        public virtual required String? Notes { get; set; }
        [ForeignKey(nameof(Recipe.GeneratedFoodItem))]
        public virtual Recipe? GeneratedFrom { get; set; }
        public virtual required ICollection<FoodItemNutrient> FoodItemNutrients { get; set; }
        public virtual required ICollection<ServingSize> ServingSizes { get; set; }
    }
}
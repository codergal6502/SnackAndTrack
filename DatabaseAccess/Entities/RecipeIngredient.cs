
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;

namespace SnackAndTrack.DatabaseAccess.Entities {
    [DebuggerDisplay("{FoodItem} in {Recipe}")]
    public class RecipeIngredient
    {
        [Key]
        public virtual required Guid Id { get; set; }
        public virtual required Recipe Recipe { get; set; }
        public virtual required FoodItem FoodItem { get; set; }
        public virtual required Unit Unit { get; set; }
        public virtual required Single Quantity { get; set; }
        public virtual required Int16 DisplayOrder { get; set; }
    }
}
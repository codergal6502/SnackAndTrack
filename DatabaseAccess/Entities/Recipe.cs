
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;

namespace SnackAndTrack.DatabaseAccess.Entities {
    [DebuggerDisplay("{Name}")]
    public class Recipe
    {
        [Key]
        public virtual required Guid Id { get; set; }
        [MaxLength(200)]
        public virtual required String Name { get; set; }
        [MaxLength(200)]
        public virtual required String? Notes { get; set; }
        public virtual String? Source { get; set; }
        [InverseProperty(nameof(FoodItem.GeneratedFrom))]
        public virtual FoodItem? GeneratedFoodItem { get; set; }
        public virtual required ICollection<RecipeIngredient> RecipeIngredients { get; set; }
        public virtual required ICollection<AmountMade> AmountsMade { get; set; }
    }
}
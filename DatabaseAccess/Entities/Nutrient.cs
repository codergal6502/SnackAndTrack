using System.ComponentModel.DataAnnotations;
using System.Diagnostics;

namespace SnackAndTrack.DatabaseAccess.Entities {
    [DebuggerDisplay("{Name} ({Group})")]
    public class Nutrient {
        [Key]
        public virtual required Guid Id { get; set; }
        public virtual required String Name { get; set; }
        public virtual required Unit DefaultUnit { get; set; }
        public virtual required Single? CurrentDailyValue { get; set; }
        public virtual required String Group { get; set; }
        public virtual required Int16 DisplayOrder { get; set; }
        public virtual required ICollection<FoodItemNutrient> FoodItemNutrients { get; set; }
    }
}
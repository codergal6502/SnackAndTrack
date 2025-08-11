using System.ComponentModel.DataAnnotations;

namespace SnackAndTrack.DatabaseAccess.Entities {
    public class NutritionGoalSet {
        [Key]
        public virtual required Guid Id { get; set; }
        [MaxLength(200)]
        public virtual required String Name { get; set; }
        public virtual required DateOnly StartDate { get; set; }
        public virtual required DateOnly? EndDate { get; set; }
        public virtual required Int16 Period { get; set; }
        public virtual required ICollection<NutritionGoalSetDayMode> NutritionGoalSetDayModes { get; set; }
        public virtual required ICollection<NutritionGoalSetNutrient> NutritionGoalSetNutrients { get; set; }
    }
}
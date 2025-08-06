namespace SnackAndTrack.DatabaseAccess.Entities
{
    public class NutritionGoalSetNutrient {
        public virtual required Guid Id { get; set; }
        public virtual required Nutrient Nutrient { get; set; }
        public virtual required ICollection<NutritionGoalSetNutrientTarget> NutritionGoalSetNutrientTargets { get; set; }
    }
}
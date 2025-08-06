namespace SnackAndTrack.DatabaseAccess.Entities
{
    public class NutritionGoalSetNutrientTarget {
        public virtual required Guid Id { get; set; }
        public virtual required Int16? Minimum { get; set; }
        public virtual required Int16? Maximum { get; set; }
        public virtual required Int16 Start { get; set; }
        public virtual required Int16 End { get; set; }
    }
}
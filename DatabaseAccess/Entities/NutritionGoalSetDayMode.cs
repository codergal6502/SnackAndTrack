using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SnackAndTrack.DatabaseAccess.Entities
{
    public class NutritionGoalSetDayMode
    {
        public virtual required Guid Id { get; set; }

        [Column(TypeName = "VARCHAR(16)")]
        public virtual required DayModeType Type { get; set; }
        public enum DayModeType { DifferentGoal, SameGoal }
    }
}
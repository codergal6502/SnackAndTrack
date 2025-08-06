using System.Text.Json.Serialization;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.Models {
    public class NutritionGoalSetModel
    {
        public required Guid? Id { get; set; }
        public required DateTime? StartDate { get; set; }
        public required DateTime? EndDate { get; set; }
        public required Int16 Period { get; set; }
        public required DayMode[] DayModes { get; set; }
        public class DayMode
        {
            public enum DayModeEnum { DifferentGoal, SameGoal }
            public required DayModeEnum Type { get; set; }
        }
        public required Nutrient[] Nutrients { get; set; }
        public class Nutrient
        {
            public required Guid NutrientId { get; set; }
            public required Dictionary<Int16, Target> Targets { get; set; }
            public class Target
            {
                public required Int16? Minimum { get; set; }
                public required Int16? Maximum { get; set; }
                public required Int16? Start { get; set; }
                public required Int16? End { get; set; }
            }
        }
    }
}
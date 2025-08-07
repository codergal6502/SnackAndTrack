using GraphQL.Types;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl {
    public class NutritionGoalSetGraphType : ObjectGraphType<NutritionGoalSet>
    {
        public NutritionGoalSetGraphType()
        {
            Field(x => x.Id);
            Field(x => x.Name);
            Field(x => x.StartDate);
            Field(x => x.EndDate);
            Field(x => x.Period);
            Field<ListGraphType<NutritionGoalSetDayModeGraphType>>(nameof(NutritionGoalSet.NutritionGoalSetDayModes)).Resolve(context => context.Source.NutritionGoalSetDayModes);
            Field<ListGraphType<NutritionGoalSetNutrientGraphType>>(nameof(NutritionGoalSet.NutritionGoalSetNutrients)).Resolve(context => context.Source.NutritionGoalSetNutrients);
        }
    }

    public class NutritionGoalSetDayModeGraphType : ObjectGraphType<NutritionGoalSetDayMode> {
        public NutritionGoalSetDayModeGraphType() {
            Field(x => x.Id);
            Field(x => x.DayNumber);
            Field(x => x.Type);
        }
    }

    public class NutritionGoalSetNutrientGraphType : ObjectGraphType<NutritionGoalSetNutrient> {
        public NutritionGoalSetNutrientGraphType()
        {
            Field(x => x.Id);
            Field<ListGraphType<NutritionGoalSetNutrientTargetType>>(nameof(NutritionGoalSetNutrient.NutritionGoalSetNutrientTargets)).Resolve(context => context.Source.NutritionGoalSetNutrientTargets);
            Field<NutrientGraphType>(nameof(NutritionGoalSetNutrient.Nutrient)).Resolve(context => context.Source.Nutrient);
        }
    }

    public class NutritionGoalSetNutrientTargetType : ObjectGraphType<NutritionGoalSetNutrientTarget> {
        public NutritionGoalSetNutrientTargetType() {
            Field(x => x.Id);
            Field(x => x.Minimum, nullable: true);
            Field(x => x.Maximum, nullable: true);
            Field(x => x.Start);
            Field(x => x.End);
        }
    }
}
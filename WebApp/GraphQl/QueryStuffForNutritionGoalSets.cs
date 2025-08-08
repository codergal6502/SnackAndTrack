using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class NutritionGoalSetsResponse : PaginatedResponse<NutritionGoalSet> { }

    public class NutritionGoalSetsResponseGraphType : PaginatedItemsResponseType<NutritionGoalSet, NutritionGoalSetGraphType, NutritionGoalSetsResponse> {
        public NutritionGoalSetsResponseGraphType() : base("List of nutritional goal sets.") { }
    }

    public enum NutritionGoalSetSortBy { Name }
}
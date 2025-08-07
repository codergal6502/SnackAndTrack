using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class NutritionGoalSetsResponse : PaginatedResponse<NutritionGoalSet> { }

    public class NutritionGoalSetsResponseType : PaginatedItemsResponseType<NutritionGoalSet, NutritionGoalSetGraphType, NutritionGoalSetsResponse> {
        public NutritionGoalSetsResponseType() : base("List of nutritional goal sets.") { }
    }

    public enum NutritionGoalSetSortBy { Name }
}
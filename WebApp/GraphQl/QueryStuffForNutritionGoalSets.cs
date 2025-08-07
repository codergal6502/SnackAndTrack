using GraphQL.Types;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class NutritionGoalSetsResponse : PaginatedResponse<NutritionGoalSet> { }

    public class NutritionGoalSetsResponseType : PaginatedItemsResponseType<NutritionGoalSet, NutritionGoalSetType, NutritionGoalSetsResponse>
    {
        public NutritionGoalSetsResponseType() : base("List of nutritional goal sets.") { }
    }
    
    public enum NutritionGoalSetSortBy { Name }    
}
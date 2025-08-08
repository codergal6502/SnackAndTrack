using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class RecipesResponse : PaginatedResponse<Recipe> { }

    public class RecipesResponseGraphType : PaginatedItemsResponseType<Recipe, RecipeGraphType, RecipesResponse> {
        public RecipesResponseGraphType() : base("List of recipes.") { }
    }
    
    public enum RecipeSortBy { Name }
}
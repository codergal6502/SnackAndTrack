using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class RecipesResponse : PaginatedResponse<Recipe> { }

    public class RecipesResponseType : PaginatedItemsResponseType<Recipe, RecipeGraphType, RecipesResponse> {
        public RecipesResponseType() : base("List of recipes.") { }
    }
    
    public enum RecipeSortBy { Name }
}
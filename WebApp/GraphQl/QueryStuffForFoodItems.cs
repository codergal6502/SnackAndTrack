using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl {
    public class FoodItemsResponse : PaginatedResponse<FoodItem> { }

    public class FoodItemsResponseGraphType : PaginatedItemsResponseType<FoodItem, FoodItemGraphType, FoodItemsResponse> {
        public FoodItemsResponseGraphType() : base("List of food items.") { }
    }

    public enum FoodItemSortBy { Name, Brand }
}
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl {
    public class FoodItemsResponse : PaginatedResponse<FoodItem> { }

    public class FoodItemsResponseType : PaginatedItemsResponseType<FoodItem, FoodItemGraphType, FoodItemsResponse> {
        public FoodItemsResponseType() : base("List of food items.") { }
    }

    public enum FoodItemSortBy { Name, Brand }
}
using GraphQL;
using GraphQL.Types;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl {
    public class FoodItemType : ObjectGraphType<FoodItem> {
        public FoodItemType() {
            Field(x => x.Id);
            Field(x => x.Name);
            Field(x => x.Brand);
            Field<ListGraphType<ServingSizeType>>(nameof(FoodItem.ServingSizes)).Resolve(context => context.Source.ServingSizes);
        }
    }
    public class ServingSizeType : ObjectGraphType<ServingSize> {
        public ServingSizeType() {
            Field(x => x.Id);
            Field(x => x.Quantity);
            Field(x => x.DisplayOrder);
            Field<UnitType>(nameof(ServingSize.Unit)).Resolve(context => context.Source.Unit);
        }
    }

    public class UnitType : ObjectGraphType<Unit> {
        public UnitType() {
            Field(x => x.Id);
            Field(x => x.AbbreviationCsv);
            Field(x => x.Name);
            Field(x => x.Type);
        }
    }

    public enum SortOrder { Ascending, Descending }
    public enum FoodItemSortBy { Name, Brand }

    public class AppQuery : ObjectGraphType {
        public AppQuery(SnackAndTrackDbContext dbContext) {
             Field<FoodItemsResponseType>(nameof(SnackAndTrackDbContext.FoodItems))
                .Argument<StringGraphType>(nameof(FoodItem.Name), $"Filter by {nameof(FoodItem.Name).ToLower()}")
                .Argument<IntGraphType>("page", "Page number for pagination")
                .Argument<IntGraphType>("pageSize", "Number of items per page")
                .Argument<EnumerationGraphType<SortOrder>>("sortOrder")
                .Argument<EnumerationGraphType<FoodItemSortBy>>("sortBy")
                .Resolve(context =>
                {
                    var nameFilter = context.GetArgument<String>(nameof(FoodItem.Name));
                    var page = context.GetArgument<int?>("page") ?? 1;
                    var pageSize = context.GetArgument<int?>("pageSize") ?? 10;

                    var query =
                        dbContext
                            .FoodItems
                            .Include(fi => fi.ServingSizes).ThenInclude(s => s.Unit)
                            .Include(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Unit)
                            .AsQueryable();

                    if (!String.IsNullOrEmpty(nameFilter)) {
                        query = query.Where(f => f.Name.Contains(nameFilter));
                    }

                    bool ascending = context.GetArgument<SortOrder?>("sortOrder") != SortOrder.Descending;

                    switch (context.GetArgument<FoodItemSortBy?>("sortBy") ?? FoodItemSortBy.Name) {
                        case FoodItemSortBy.Name:
                        default:
                            query = ascending ? query.OrderBy(fi => fi.Name).ThenBy(fi => fi.Id) : query.OrderByDescending(fi => fi.Name).ThenByDescending(fi => fi.Id);
                            break;
                        case FoodItemSortBy.Brand:
                            query = ascending ? query.OrderBy(fi => fi.Brand).ThenBy(fi => fi.Id) : query.OrderByDescending(fi => fi.Name).ThenByDescending(fi => fi.Id);
                            break;
                    }

                    var totalCount = query.Count();
                    var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                    if (page < 1) page = 1;
                    if (page > totalPages) page = totalPages;

                    var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

                    return new FoodItemsResponse
                    {
                        TotalCount = totalCount,
                        Items = items.Result,
                        TotalPages = totalPages,
                    };
                });
        }
    }

    public class AppSchema : Schema {
        public AppSchema(AppQuery query) {
            Query = query;
        }
    }

    public class FoodItemsResponseType : ObjectGraphType<FoodItemsResponse> {
        public FoodItemsResponseType() {
            Field(x => x.TotalCount);
            Field(x => x.TotalPages);
            Field<ListGraphType<FoodItemType>>(nameof(FoodItemsResponse.Items)).Description("List of food items.");
        }
    }

    public class FoodItemsResponse {
        public FoodItemsResponse() {
            Items = [];
        }

        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public List<FoodItem> Items { get; set; }
    }
}
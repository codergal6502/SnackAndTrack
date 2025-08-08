using GraphQL;
using GraphQL.Types;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl {
    public class AppQuery : ObjectGraphType {
        public AppQuery(SnackAndTrackDbContext dbContext) {

            Field<RecipesResponseType>(nameof(SnackAndTrackDbContext.Recipes))
                .Argument<StringGraphType>(nameof(Recipe.Name), $"Filter by {nameof(Recipe.Name)}")
                .Argument<IntGraphType>("page", "Page number for pagination")
                .Argument<IntGraphType>("pageSize", "Number of items per page")
                .Argument<EnumerationGraphType<SortOrder>>("sortOrder")
                .Argument<EnumerationGraphType<RecipeSortBy>>("sortBy")
                .Resolve(context =>
                {
                    var nameFilter = context.GetArgument<String>(nameof(Recipe.Name));
                    var page = context.GetArgument<int?>("page") ?? 1;
                    var pageSize = context.GetArgument<int?>("pageSize") ?? 10;

                    var query =
                        dbContext
                            .Recipes
                            .Include(r => r.AmountsMade).ThenInclude(am => am.Unit)
                            .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.FoodItem)
                            .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.Unit)
                            .AsQueryable();

                    if (!String.IsNullOrEmpty(nameFilter)) {
                        query = query.Where(ngs => ngs.Name.ToLower().Contains(Name.ToLower()));
                    }

                    bool ascending = context.GetArgument<SortOrder?>("sortOrder") != SortOrder.Descending;

                    switch (context.GetArgument<RecipeSortBy?>("sortBy") ?? RecipeSortBy.Name) {
                        case RecipeSortBy.Name:
                        default:
                            query = ascending ? query.OrderBy(r => r.Name).ThenBy(r => r.Id) : query.OrderByDescending(r => r.Name).ThenByDescending(r => r.Id);
                            break;
                    }

                    var totalCount = query.Count();
                    var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                    var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

                    return new RecipesResponse
                    {
                        TotalCount = totalCount,
                        Items = items.Result,
                        TotalPages = totalPages,
                    };
                });

            Field<NutritionGoalSetsResponseType>(nameof(SnackAndTrackDbContext.NutritionGoalSets))
                .Argument<StringGraphType>(nameof(NutritionGoalSet.Name), $"Filter by {nameof(NutritionGoalSet.Name)}")
                .Argument<IntGraphType>("page", "Page number for pagination")
                .Argument<IntGraphType>("pageSize", "Number of items per page")
                .Argument<EnumerationGraphType<SortOrder>>("sortOrder")
                .Argument<EnumerationGraphType<NutritionGoalSetSortBy>>("sortBy")
                .Resolve(context =>
                {
                    var nameFilter = context.GetArgument<String>(nameof(NutritionGoalSet.Name));
                    var page = context.GetArgument<int?>("page") ?? 1;
                    var pageSize = context.GetArgument<int?>("pageSize") ?? 10;

                    var query =
                        dbContext
                            .NutritionGoalSets
                            .Include(ngs => ngs.NutritionGoalSetDayModes.OrderBy(ngsDm => ngsDm.DayNumber))
                            .Include(ngs => ngs.NutritionGoalSetNutrients).ThenInclude(ngsSn => ngsSn.Nutrient).ThenInclude(n => n.DefaultUnit)
                            .Include(ngs => ngs.NutritionGoalSetNutrients).ThenInclude(ngsSn => ngsSn.NutritionGoalSetNutrientTargets)
                            .AsQueryable();

                    if (!String.IsNullOrEmpty(nameFilter)) {
                        query = query.Where(ngs => ngs.Name.ToLower().Contains(Name.ToLower()));
                    }

                    bool ascending = context.GetArgument<SortOrder?>("sortOrder") != SortOrder.Descending;

                    switch (context.GetArgument<NutritionGoalSetSortBy?>("sortBy") ?? NutritionGoalSetSortBy.Name) {
                        case NutritionGoalSetSortBy.Name:
                        default:
                            query = ascending ? query.OrderBy(ngs => ngs.Name).ThenBy(ngs => ngs.Id) : query.OrderByDescending(ngs => ngs.Name).ThenByDescending(ngs => ngs.Id);
                            break;
                    }

                    var totalCount = query.Count();
                    var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                    var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

                    return new NutritionGoalSetsResponse
                    {
                        TotalCount = totalCount,
                        Items = items.Result,
                        TotalPages = totalPages,
                    };
                });

            Field<FoodItemsResponseType>(nameof(SnackAndTrackDbContext.FoodItems))
                .Argument<StringGraphType>(nameof(FoodItem.Name), $"Filter by {nameof(FoodItem.Name).ToLower()}")
                .Argument<IntGraphType>("page", "Page number for pagination")
                .Argument<IntGraphType>("pageSize", "Number of items per page")
                .Argument<EnumerationGraphType<SortOrder>>("sortOrder")
                .Argument<EnumerationGraphType<FoodItemSortBy>>("sortBy")
                .Resolve(context => {
                    var nameFilter = context.GetArgument<String>(nameof(FoodItem.Name));
                    var page = context.GetArgument<int?>("page") ?? 1;
                    var pageSize = context.GetArgument<int?>("pageSize") ?? 10;

                    var query =
                        dbContext
                            .FoodItems
                            .Include(fi => fi.ServingSizes).ThenInclude(s => s.Unit)
                            .Include(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Unit)
                            .Include(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Nutrient)
                            .AsQueryable();

                    if (!String.IsNullOrEmpty(nameFilter)) {
                        query = query.Where(f => f.Name.ToLower().Contains(nameFilter.ToLower()));
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

                    if (totalPages < 1) totalPages = 1;
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

            Field<ListGraphType<UnitGraphType>>(nameof(SnackAndTrackDbContext.Units))
                .Resolve(context => {
                   var query =
                        dbContext
                            .Units
                            .Include(u => u.FromUnitConversions).ThenInclude(c => c.ToUnit)
                            .AsQueryable();
                    return query.ToList();
                });
        }
    }
}
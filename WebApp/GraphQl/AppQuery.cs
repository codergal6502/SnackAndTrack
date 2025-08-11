using GraphQL;
using GraphQL.Types;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl {
    public class AppQuery : ObjectGraphType {
        public AppQuery(SnackAndTrackDbContext dbContext) {
            SetUpSearches(dbContext);
            SetUpSingleEntities(dbContext);
            SetUpLookups(dbContext);
        }
        
        private void SetUpSearches(SnackAndTrackDbContext dbContext) {
            // Field<FoodJournalEntriesResponse>(nameof(SnackAndTrackDbContext.FoodJournalEntries)).Resolve(ctx => new FoodJournalEntriesResponse { });
            Field<FoodJournalEntriesResponseGraphType>(nameof(SnackAndTrackDbContext.FoodJournalEntries))
                .Argument<DateOnlyGraphType>(nameof(FoodJournalEntry.Date), $"Filter by {nameof(FoodJournalEntry.Date)}")
                .Argument<IntGraphType>("page", "Page number for pagination")
                .Argument<IntGraphType>("pageSize", "Number of items per page")
                .Argument<EnumerationGraphType<SortOrder>>("sortOrder")
                .Argument<EnumerationGraphType<FoodJournalEntriesortBy>>("sortBy")
                .Resolve(context => {
                    var dateFilter = context.GetArgument<DateOnly?>(nameof(FoodJournalEntry.Date));
                    var page = context.GetArgument<int?>("page") ?? 1;
                    var pageSize = context.GetArgument<int?>("pageSize") ?? 10;

                    var query =
                        dbContext
                            .FoodJournalEntries
                            .Include(fje => fje.FoodItem).ThenInclude(fi => fi.ServingSizes).ThenInclude(s => s.Unit)
                            .Include(fje => fje.FoodItem).ThenInclude(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Nutrient)
                            .Include(fje => fje.FoodItem).ThenInclude(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Unit)
                            .Include(fje => fje.Unit)
                            .AsQueryable();

                    if (null != dateFilter) {
                        query = query.Where(fje => fje.Date == dateFilter);
                    }

                    bool ascending = context.GetArgument<SortOrder?>("sortOrder") != SortOrder.Descending;

                    switch (context.GetArgument<FoodJournalEntriesortBy?>("sortBy") ?? FoodJournalEntriesortBy.Time) {
                        case FoodJournalEntriesortBy.Time:
                        default:
                            query = ascending ? query.OrderBy(j => j.Time).ThenBy(j => j.Id) : query.OrderByDescending(j => j.Time).ThenByDescending(t => t.Id);
                            break;
                        case FoodJournalEntriesortBy.FoodItem:
                            query = ascending ? query.OrderBy(j => j.FoodItem.Name).ThenBy(j => j.Id) : query.OrderByDescending(j => j.FoodItem.Name).ThenByDescending(t => t.Id);
                            break;
                    }

                    var totalCount = query.Count();
                    var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                    var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

                    return new FoodJournalEntriesResponse {
                        TotalCount = totalCount,
                        Items = items.Result,
                        TotalPages = totalPages,
                    };
                });

            Field<RecipesResponseGraphType>(nameof(SnackAndTrackDbContext.Recipes))
                .Argument<StringGraphType>(nameof(Recipe.Name), $"Filter by {nameof(Recipe.Name)}")
                .Argument<IntGraphType>("page", "Page number for pagination")
                .Argument<IntGraphType>("pageSize", "Number of items per page")
                .Argument<EnumerationGraphType<SortOrder>>("sortOrder")
                .Argument<EnumerationGraphType<RecipeSortBy>>("sortBy")
                .Resolve(context => {
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
                        query = query.Where(ngs => ngs.Name.ToLower().Contains(nameFilter.ToLower()));
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

                    return new RecipesResponse {
                        TotalCount = totalCount,
                        Items = items.Result,
                        TotalPages = totalPages,
                    };
                });

            Field<NutritionGoalSetsResponseGraphType>(nameof(SnackAndTrackDbContext.NutritionGoalSets))
                .Argument<StringGraphType>(nameof(NutritionGoalSet.Name), $"Filter by {nameof(NutritionGoalSet.Name)}")
                .Argument<IntGraphType>("page", "Page number for pagination")
                .Argument<IntGraphType>("pageSize", "Number of items per page")
                .Argument<EnumerationGraphType<SortOrder>>("sortOrder")
                .Argument<EnumerationGraphType<NutritionGoalSetSortBy>>("sortBy")
                .Resolve(context => {
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

                    return new NutritionGoalSetsResponse {
                        TotalCount = totalCount,
                        Items = items.Result,
                        TotalPages = totalPages,
                    };
                });

            Field<FoodItemsResponseGraphType>(nameof(SnackAndTrackDbContext.FoodItems))
                .Argument<StringGraphType>(nameof(FoodItem.Name), $"Filter by {nameof(FoodItem.Name).ToLower()}")
                .Argument<StringGraphType>("Query", $"Filter by multiple fields.")
                .Argument<IntGraphType>("page", "Page number for pagination")
                .Argument<IntGraphType>("pageSize", "Number of items per page")
                .Argument<BooleanGraphType>(nameof(FoodItem.UsableAsRecipeIngredient), $"Filter by {nameof(FoodItem.UsableAsRecipeIngredient)}")
                .Argument<BooleanGraphType>(nameof(FoodItem.UsableInFoodJournal), $"Filter by {nameof(FoodItem.UsableInFoodJournal)}")
                .Argument<EnumerationGraphType<SortOrder>>("sortOrder")
                .Argument<EnumerationGraphType<FoodItemSortBy>>("sortBy")
                .Resolve(context => {
                    var nameFilter = context.GetArgument<String>(nameof(FoodItem.Name))?.ToLower();
                    var textFilter = context.GetArgument<String>("Query")?.ToLower();
                    var page = context.GetArgument<int?>("page") ?? 1;
                    var pageSize = context.GetArgument<int?>("pageSize") ?? 10;
                    var usableAsRecipeIngredientFilter = context.GetArgument<bool?>(nameof(FoodItem.UsableAsRecipeIngredient));
                    var usableInFoodJournalFilter = context.GetArgument<bool?>(nameof(FoodItem.UsableInFoodJournal));

                    var query =
                        dbContext
                            .FoodItems
                            .Include(fi => fi.GeneratedFrom)
                            .Include(fi => fi.ServingSizes).ThenInclude(s => s.Unit)
                            .Include(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Unit)
                            .Include(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Nutrient)
                            .AsQueryable();

                    if (!String.IsNullOrEmpty(textFilter)) {
                        query = query.Where(f => f.Name.ToLower().Contains(textFilter) || f.Brand.ToLower().Contains(textFilter));
                    }

                    if (!String.IsNullOrEmpty(nameFilter)) {
                        query = query.Where(f => f.Name.ToLower().Contains(nameFilter));
                    }

                    if (usableAsRecipeIngredientFilter.HasValue) {
                        query = query.Where(f => usableAsRecipeIngredientFilter == f.UsableAsRecipeIngredient);
                    }

                    if (usableInFoodJournalFilter.HasValue) {
                        query = query.Where(f => usableInFoodJournalFilter == f.UsableInFoodJournal);
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

                    return new FoodItemsResponse {
                        TotalCount = totalCount,
                        Items = items.Result,
                        TotalPages = totalPages,
                    };
                });
        }

        private void SetUpSingleEntities(SnackAndTrackDbContext dbContext) {
            Field<FoodItemGraphType>(nameof(FoodItem))
                .Argument<NonNullGraphType<GuidGraphType>>(nameof(FoodItem.Id), $"{nameof(FoodItem.Id)} of {nameof(FoodItem)} to retrieve.")
                .ResolveAsync(async context => {
                    var id = context.GetArgument<Guid>(nameof(FoodItem.Id));

                    return await dbContext
                        .FoodItems
                        .Include(fi => fi.GeneratedFrom)
                        .Include(fi => fi.FoodItemNutrients.OrderBy(fin => fin.DisplayOrder)).ThenInclude(fin => fin.Nutrient)
                        .Include(fi => fi.FoodItemNutrients.OrderBy(fin => fin.DisplayOrder)).ThenInclude(fin => fin.Unit)
                        .Include(fi => fi.ServingSizes.OrderBy(s => s.DisplayOrder)).ThenInclude(s => s.Unit)
                        .SingleOrDefaultAsync(fi => fi.Id == id);
                });

            Field<RecipeGraphType>(nameof(Recipe))
                .Argument<NonNullGraphType<GuidGraphType>>(nameof(Recipe.Id), $"{nameof(Recipe.Id)} of {nameof(Recipe)} to retrieve.")
                .ResolveAsync(async context => {
                    var id = context.GetArgument<Guid>(nameof(Recipe.Id));

                    return await dbContext
                        .Recipes
                        .Include(r => r.AmountsMade.OrderBy(am => am.DisplayOrder)).ThenInclude(am => am.Unit)
                        .Include(r => r.RecipeIngredients.OrderBy(ri => ri.DisplayOrder)).ThenInclude(ri => ri.FoodItem).ThenInclude(fi => fi.ServingSizes).ThenInclude(s => s.Unit)
                        .Include(r => r.RecipeIngredients.OrderBy(ri => ri.DisplayOrder)).ThenInclude(ri => ri.Unit)
                        .SingleOrDefaultAsync(r => r.Id == id);
                });
        }

        private void SetUpLookups(SnackAndTrackDbContext dbContext) {
            Field<ListGraphType<UnitGraphType>>(nameof(SnackAndTrackDbContext.Units))
                .Resolve(context => {
                    var query =
                         dbContext
                             .Units
                             .Include(u => u.FromUnitConversions).ThenInclude(c => c.ToUnit)
                             .AsQueryable();
                    return query.ToList();
                });

            Field<ListGraphType<NutrientGraphType>>(nameof(SnackAndTrackDbContext.Nutrients))
                .Resolve(context => {
                    var query =
                         dbContext
                             .Nutrients
                             .Include(n => n.DefaultUnit);

                    return query.ToList();
                });
        }
    }
}
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.DatabaseAccess.Entities;
using SnackAndTrack.WebApp.Models;

namespace SnackAndTrack.WebApp.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class RecipesController : ControllerBase {
        private readonly SnackAndTrackDbContext _context;

        public RecipesController(SnackAndTrackDbContext context) {
            this._context = context;
        }

        // GET: api/Recipes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RecipeModel>>> GetRecipes([FromQuery] String? q, [FromQuery] String? qName) {
            IQueryable<Recipe> recipes = this._context.Recipes;

            if (!String.IsNullOrWhiteSpace(q)) {
                q = q.Trim().ToLower();
                recipes = recipes.Where(fi => fi.Name.ToLower().Contains(q));
            }

            if (!String.IsNullOrWhiteSpace(qName)) {
                qName = qName.Trim().ToLower();
                recipes = recipes.Where(fi => fi.Name.ToLower().Contains(qName));
            }

            return await recipes.Select(fi => ConvertEntityToModel(fi)).ToListAsync();
        }

        // GET: api/Recipes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<RecipeModel>> GetRecipe(Guid id) {
            var recipe = await SingleRecipeBaseQuery().SingleOrDefaultAsync(r => r.Id == id);

            if (recipe == null) {
                return NotFound();
            }

            return ConvertEntityToModel(recipe);
        }

        private IQueryable<Recipe> SingleRecipeBaseQuery() {
            // See https://stackoverflow.com/a/50898208.
            return this
                ._context
                .Recipes
                    .Include(r => r.AmountsMade.OrderBy(am => am.DisplayOrder)).ThenInclude(am => am.Unit)
                    .Include(r => r.RecipeIngredients.OrderBy(ri => ri.DisplayOrder)).ThenInclude(ri => ri.FoodItem).ThenInclude(fi => fi.ServingSizes).ThenInclude(s => s.Unit)
                    .Include(r => r.RecipeIngredients.OrderBy(ri => ri.DisplayOrder)).ThenInclude(ri => ri.Unit);
        }

        [HttpPost]
        public async Task<ActionResult<RecipeModel>> PostRecipe(RecipeModel model) {
            Recipe recipe = new Recipe {
                Id = Guid.NewGuid()
              , Name = model.Name
              , Source = model.Source
              , RecipeIngredients = []
              , AmountsMade = []
            };

            await PopulateRecipeAmountsMade(model, recipe);
            await PopulateRecipeIngredients(model, recipe);

            this._context.Add(recipe);

            await this._context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRecipe), new { id = recipe.Id }, ConvertEntityToModel(recipe));
        }

        // PUT: api/Recipe/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRecipe(Guid id, RecipeModel model)
        {
            if (id != model.Id)
            {
                return BadRequest();
            }

            Recipe recipe = await SingleRecipeBaseQuery()
                .SingleAsync(fi => fi.Id == id);

            if (null == recipe)
            {
                return NotFound();
            }

            await PopulateRecipe(model, recipe);

            return NoContent();
        }

        [HttpGet("computeFoodItem/{id}")]
        public async Task<ActionResult<RecipeComputedFoodItemTableModel>> ComputeFoodItem(Guid id)
        {
            var unit = _context.Units.Include(u => u.FromUnitConversions).ThenInclude(c => c.ToUnit).Include(u => u.ToUnitConversions).ThenInclude(c => c.FromUnit).Single(u => u.Name == "Teaspoons");
            var conversions = unit.FromUnitConversions.ToList();
            var isOneThird = conversions.Single(c => c.ToUnit.Name == "Tablespoons");
            Recipe recipe = await GetRecipeForFoodItemProcessing(id);

            var table = GenerateComputedFoodItemTable(recipe);

            return await table;
        }

        [HttpPost("createFoodItemForRecipe")]
        public async Task<ActionResult> CreateFoodItemForRecipe(RecipeFoodItemSetupModel model) {
            var recipe = await GetRecipeForFoodItemProcessing(model.RecipeId);

            var units = _context.Units.ToList();

            var firstAmountMade = recipe.AmountsMade.First();
            var matchingServingSizeConversion = model.ServingSizeConversions.Single(ssc => firstAmountMade.Unit.Id == ssc.UnitId);
            var servingRecipeRatio = matchingServingSizeConversion.Quantity / firstAmountMade.Quantity;
            var table = await GenerateComputedFoodItemTable(recipe);

#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type.
            FoodItem foodItem = new FoodItem {
                Id = Guid.NewGuid()
              , Name = recipe.Name
              , Brand = String.Empty
              , GeneratedFrom = recipe
              , ServingSizes = null // temporary
              , FoodItemNutrients = null // temporary
            };
#pragma warning restore CS8625 // Cannot convert null literal to non-nullable reference type.

            foodItem.ServingSizes = model.ServingSizeConversions.Select((ssc, i) => new ServingSize {
                Id = Guid.NewGuid()
              , DisplayOrder = (Int16) i
              , Quantity = ssc.Quantity
              , FoodItem = foodItem
              , Unit = units.Single(u => u.Id == ssc.UnitId)
            }).ToArray();

            foodItem.FoodItemNutrients = table.NutrientSummaries.Select((ns, i) => new FoodItemNutrient {
                Id = Guid.NewGuid()
              , DisplayOrder = (Int16) i
              , Unit = units.Single(u => u.Id == ns.NutrientUnitId)
              , FoodItem = foodItem
              , Nutrient = _context.Nutrients.Single(n => n.Id == ns.NutrientId)
              , Quantity = ns.TotalQuantity
            }).ToArray();

            _context.Add(foodItem);
            _context.AddRange(foodItem.ServingSizes);
            _context.AddRange(foodItem.FoodItemNutrients);

            await _context.SaveChangesAsync();

            return new OkObjectResult(new { FoodItemId = foodItem.Id });
        }

        private async Task<Recipe> GetRecipeForFoodItemProcessing(Guid id)
        {
            return await this
                ._context
                .Recipes
                    .Include(r => r.AmountsMade).ThenInclude(am => am.Unit)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.FoodItem).ThenInclude(fi => fi.ServingSizes).ThenInclude(s => s.Unit)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.FoodItem).ThenInclude(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Nutrient).ThenInclude(n => n.DefaultUnit)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.FoodItem).ThenInclude(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Unit)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.Unit).ThenInclude(u => u.FromUnitConversions).ThenInclude(c => c.ToUnit)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.Unit).ThenInclude(u => u.ToUnitConversions).ThenInclude(c => c.FromUnit)
                .SingleAsync(r => r.Id == id);
        }

        private async Task<RecipeComputedFoodItemTableModel> GenerateComputedFoodItemTable(Recipe recipe) {
            RecipeComputedFoodItemTableModel table = new() { NutrientSummaries = [] };

            var allNutrients = recipe.RecipeIngredients.SelectMany(ri => ri.FoodItem.FoodItemNutrients).Select(fin => fin.Nutrient).Distinct();

            foreach (var recipeIngredient in recipe.RecipeIngredients) {
                // A little dimensional analysis. We want nutrient quantity. We have quantity of ingredient.

                // ru is recipe units
                // su is serving units
                // nu is nutrient units

                // R  is recipe quantity in rus
                // C  is conversion from recipe units to serving units
                // S  is serving quantity in sus
                // N  is the nutrient

                // R ru     1 su   1 serving     N nu
                // ----  * ---- * --------- * ---------
                // recipe   C ru      S su     1 serving

                // That gets you how manu nutrient units per recipe.

                Single recipeQuantity = recipeIngredient.Quantity;
                Single unitConversionForFoodItemServing;

                var foodItem = recipeIngredient.FoodItem;
                var recipeUnit = recipeIngredient.Unit;
                var recipeUnitType = recipeUnit.Type;

                var foodItemServingSize = foodItem.ServingSizes.Single(s => s.Unit.Type == recipeUnit.Type);
                if (recipeUnit == foodItemServingSize.Unit) {
                    unitConversionForFoodItemServing = 1; // they're literally the same.
                }
                else {
                    unitConversionForFoodItemServing = (Single) foodItemServingSize.Unit.FromUnitConversions.Single(c => c.ToUnit == recipeUnit).Ratio;
                }

                // This gets us everything but the last bit in that computation.
                var nutrientPerRecipeRatio = recipeQuantity / unitConversionForFoodItemServing / foodItemServingSize.Quantity;

                foreach (var possibleNutrient in allNutrients) {
                    var fin = foodItem.FoodItemNutrients.SingleOrDefault(fin => fin.Nutrient == possibleNutrient);

                    // This is the last bit in that computation.
                    Single? nutrientPerRecipe = fin == null ? null : fin.Quantity * nutrientPerRecipeRatio;

                    var nutrientSummary = table.NutrientSummaries.SingleOrDefault(ns => ns.NutrientId == possibleNutrient.Id) ;

                    if (null == nutrientSummary) {
                        nutrientSummary = new() {
                            NutrientName = possibleNutrient.Name
                          , NutrientId = possibleNutrient.Id
                          , FoodItemContributions = []

                          , NutrientUnitName = possibleNutrient.DefaultUnit.Name
                          , NutrientUnitType = possibleNutrient.DefaultUnit.Type
                          , NutrientUnitId = possibleNutrient.DefaultUnit.Id
                          , NutrientUnitDisplayOrder = possibleNutrient.DisplayOrder
                          , TotalQuantity = 0
                        };

                        table.NutrientSummaries.Add(nutrientSummary);
                    }

                    nutrientSummary.FoodItemContributions.Add(new() {
                        NutrientQuantity = nutrientPerRecipe
                      , NutrientUnitId = recipeIngredient.Unit.Id
                      , NutrientUnitName = fin?.Unit?.Name
                      , FoodItemName = foodItem.Name
                      , FoodItemId = foodItem.Id
                    });

                    if (fin != null) {
                        Single unitConversionForTotal;
                        
                        if (fin.Unit.Id != possibleNutrient.DefaultUnit.Id) {
                            var conversion = await this._context.UnitConversions.Include(c => c.FromUnit).Include(c => c.ToUnit).SingleAsync(c => c.FromUnit.Id == fin.Unit.Id && c.ToUnit.Id == possibleNutrient.DefaultUnit.Id);
                            unitConversionForTotal = conversion.Ratio;
                        }
                        else {
                            unitConversionForTotal = 1; // they're literally the same ... again!
                        }
                        nutrientSummary.TotalQuantity += unitConversionForTotal * nutrientPerRecipe ?? 0;
                    }
                }
            }

            return table;
        }

        private async Task PopulateRecipe(RecipeModel model, Recipe recipe) {
            recipe.Name = model.Name;
            recipe.Source = model.Source;

            await PopulateRecipeAmountsMade(model, recipe);
            await PopulateRecipeIngredients(model, recipe);

            await this._context.SaveChangesAsync();
        }

        private static RecipeModel ConvertEntityToModel(Recipe recipe) {
            return new RecipeModel {
                Id = recipe.Id
              , Name = recipe.Name
              , Source = recipe.Source
              , Ingredients = (null == recipe.RecipeIngredients) ? [] : recipe.RecipeIngredients.OrderBy(ri => ri.DisplayOrder).Select(ri =>
                    new RecipeModel.Ingredient {
                        FoodItemId = ri.FoodItem.Id
                      , FoodItemName = ri.FoodItem.Name
                      , QuantityUnitId = ri.Unit.Id
                      , QuantityUnitType = ri.Unit.Type
                      , QuantityUnitName = ri.Unit.Name
                      , Quantity = ri.Quantity
                      , QuantityUnitTypeOptions = ri.FoodItem.ServingSizes.Select(s => s.Unit.Type).Distinct().ToArray()
                    }
                ).ToArray()
              , AmountsMade = (null == recipe.AmountsMade) ? [] : recipe.AmountsMade.OrderBy(am => am.DisplayOrder).Select(am =>
                    new RecipeModel.AmountMade {
                        Quantity = am.Quantity
                      , QuantityUnitId = am.Unit.Id
                      , QuantityUnitName = am.Unit.Name
                      , QuantityUnitType = am.Unit.Type
                    }
                ).ToArray()
            };
        }

        private async Task PopulateRecipeAmountsMade(RecipeModel model, Recipe recipe) {
            List<RecipeModel.AmountMade> amountMadeModels = model.AmountsMade.ToList();
            List<AmountMade> existingAmountsMade = recipe.AmountsMade.ToList();

            foreach (var i in amountMadeModels.Select((x, i) => new { AmountMadeModel = x, Index = (Int16) i })) {
                var amountMadeModel = i.AmountMadeModel;
                var existingAmountMade = existingAmountsMade.SingleOrDefault(am => am.Unit.Id == amountMadeModel.QuantityUnitId);

                if (null == existingAmountMade) {
                    Unit unit = await this._context.Units.SingleAsync(u => u.Id == amountMadeModel.QuantityUnitId);

                    AmountMade amountMade = new AmountMade {
                        Id = Guid.NewGuid()
                      , Quantity = amountMadeModel.Quantity
                      , Recipe = recipe
                      , Unit = unit
                      , DisplayOrder = i.Index
                    };

                    recipe.AmountsMade.Add(amountMade);
                    this._context.Add(amountMade);
                }
                else {
                    existingAmountMade.Quantity = amountMadeModel.Quantity;
                    existingAmountMade.DisplayOrder = i.Index;

                    // Any that are left at the end should be removed from the database.
                    existingAmountsMade.Remove(existingAmountMade);
                }
            }

            // Any that are left at the end should be removed from the database.
            foreach (var am in existingAmountsMade)
            {
                recipe.AmountsMade.Remove(am);
                this._context.Remove(am);
            }
        }

        private async Task PopulateRecipeIngredients(RecipeModel model, Recipe recipe) {
            List<RecipeModel.Ingredient> ingredientModels = model.Ingredients.ToList();
            List<RecipeIngredient> existingRecipeIngredients = recipe.RecipeIngredients.ToList();

            foreach (var i in ingredientModels.Select((x, i) => new { IngredientModel = x, Index = (Int16) i })) {
                var ingredientModel = i.IngredientModel;
                var existingRecipeIngredient = existingRecipeIngredients.SingleOrDefault(ri => ri.FoodItem.Id == ingredientModel.FoodItemId);

                Unit? unit = await _context.Units.SingleOrDefaultAsync(u => u.Id == ingredientModel.QuantityUnitId);

                if (null == unit) {
                    throw new SnackAndTrackControllerException($"Searched for unit {ingredientModel.QuantityUnitId} but 0 or multiple.");
                }

                if (null == existingRecipeIngredient) {
                    FoodItem? foodItem = await _context.FoodItems.SingleOrDefaultAsync(u => u.Id == ingredientModel.FoodItemId);

                    if (null == foodItem) {
                        throw new SnackAndTrackControllerException($"Searched for food item {ingredientModel.FoodItemId} but 0 or multiple.");
                    }

                    RecipeIngredient recipeIngredient = new RecipeIngredient {
                        Id = Guid.NewGuid()
                      , Recipe = recipe
                      , FoodItem = foodItem
                      , Unit = unit
                      , Quantity = ingredientModel.Quantity
                      , DisplayOrder = i.Index
                    };

                    this._context.Add(recipeIngredient);
                    recipe.RecipeIngredients.Add(recipeIngredient);
                }
                else {
                    existingRecipeIngredient.Unit = unit;
                    existingRecipeIngredient.Quantity = ingredientModel.Quantity;
                    existingRecipeIngredient.DisplayOrder = i.Index;

                    // Any that are left at the end should be removed from the database.
                    existingRecipeIngredients.Remove(existingRecipeIngredient);
                }
            }

            // Any that are left at the end should be removed from the database.
            foreach (var ri in existingRecipeIngredients)
            {
                recipe.RecipeIngredients.Remove(ri);
                this._context.Remove(ri);
            }
        }
    }
}
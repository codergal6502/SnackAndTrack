using System.Threading.Tasks;
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
        public async Task<ActionResult<RecipeComputedFoodItemTableModel>> ComputeFoodItem(Guid id) {
            
            var unit = _context.Units.Include(u => u.FromUnitConversions).ThenInclude(c => c.ToUnit).Include(u => u.ToUnitConversions).ThenInclude(c => c.FromUnit).Single(u => u.Name == "Teaspoons");
            var conversions = unit.FromUnitConversions.ToList();
            var isOneThird = conversions.Single(c => c.ToUnit.Name == "Tablespoons");


            var recipe = await this
                ._context
                .Recipes
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.FoodItem).ThenInclude(fi => fi.ServingSizes).ThenInclude(s => s.Unit)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.FoodItem).ThenInclude(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Nutrient)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.Unit).ThenInclude(u => u.FromUnitConversions).ThenInclude(c => c.ToUnit)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.Unit).ThenInclude(u => u.ToUnitConversions).ThenInclude(c => c.FromUnit)
                .SingleAsync(r => r.Id == id);

            var table = ComputeFoodItemFor(recipe);
            
            return table;
        }

        public class RecipeComputedFoodItemTableModel {
            public class NutrientSummary
            {
                public required Guid NutrientId { get; set; }
                public required String NutrientName { get; set; }

                public required IList<FoodItemContribution> FoodItemContributions { get; set; }

                public class FoodItemContribution
                {
                    public required Single? NutrientQuantity { get; set; }
                    public required String? NutrientUnitName { get; set; }
                    public required Guid? NutrientUnitId { get; set; }
                    public required String FoodItemName { get; set; }
                    public required Guid FoodItemId { get; set; }
                }
            }

            public required IList<NutrientSummary> NutrientSummaries { get; set; }
        }

        private RecipeComputedFoodItemTableModel ComputeFoodItemFor(Recipe recipe)
        {
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
                Single unitConversion;

                var foodItem = recipeIngredient.FoodItem;
                var recipeUnit = recipeIngredient.Unit;
                var recipeUnitType = recipeUnit.Type;

                var foodItemServingSize = foodItem.ServingSizes.Single(s => s.Unit.Type == recipeUnit.Type);
                if (recipeUnit == foodItemServingSize.Unit) {
                    unitConversion = 1; // they're literally the same.
                }
                else {
                    unitConversion = (Single) foodItemServingSize.Unit.FromUnitConversions.Single(c => c.ToUnit == recipeUnit).Ratio;
                }

                // This gets us everything but the last bit in that computation.
                var nutrientPerRecipeRatio = recipeQuantity / unitConversion / foodItemServingSize.Quantity;

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
                        };

                        table.NutrientSummaries.Add(nutrientSummary);
                    }

                    nutrientSummary.FoodItemContributions.Add(new() {
                        NutrientQuantity = nutrientPerRecipe
                      , NutrientUnitId = recipeIngredient.Unit.Id
                      , NutrientUnitName = recipeIngredient.Unit.Name
                      , FoodItemName = foodItem.Name
                      , FoodItemId = foodItem.Id
                    });

                    // Console.Out.WriteLine("{0} of {1} from {2}", nutrientPerRecipe, fin.Nutrient.Name, foodItem.Name);
                }
            }

            return table;
        }

        private async Task PopulateRecipe(RecipeModel model, Recipe recipe)
        {
            recipe.Name = model.Name;
            recipe.Source = model.Source;

            await PopulateRecipeAmountsMade(model, recipe);
            await PopulateRecipeIngredients(model, recipe);

            await this._context.SaveChangesAsync();
        }

        private static RecipeModel ConvertEntityToModel(Recipe recipe)
        {
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
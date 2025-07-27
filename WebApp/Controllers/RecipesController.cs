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

            // ComputeFoodItemFor(recipe);

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
            
            // ComputeFoodItemFor(recipe);

            return NoContent();
        }

        [HttpGet("computeFoodItem/{id}")]
        public async Task<IActionResult> ComputeFoodItem(Guid id) {
            
            var unit = _context.Units.Include(u => u.FromUnitConversions).ThenInclude(c => c.ToUnit).Include(u => u.ToUnitConversions).ThenInclude(c => c.FromUnit).Single(u => u.UnitName == "Teaspoons");
            var conversions = unit.FromUnitConversions.ToList();
            var isOneThird = conversions.Single(c => c.ToUnit.UnitName == "Tablespoons");


            var recipe = await this
                ._context
                .Recipes
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.FoodItem).ThenInclude(fi => fi.ServingSizes).ThenInclude(s => s.Unit)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.FoodItem).ThenInclude(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Nutrient)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.Unit).ThenInclude(u => u.FromUnitConversions).ThenInclude(c => c.ToUnit)
                    .Include(r => r.RecipeIngredients).ThenInclude(ri => ri.Unit).ThenInclude(u => u.ToUnitConversions).ThenInclude(c => c.FromUnit)
                .SingleAsync(r => r.Id == id);
            ComputeFoodItemFor(recipe);
            throw new NotImplementedException();
        }

        private void ComputeFoodItemFor(Recipe recipe)
        {
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
                var recipeUnitType = recipeUnit.UnitType;

                var foodItemServingSize = foodItem.ServingSizes.Single(s => s.Unit.UnitType == recipeUnit.UnitType);
                if (recipeUnit == foodItemServingSize.Unit) {
                    unitConversion = 1; // they're the same.
                }
                else {
                    // Unfortunately, we have the backward relationship here.
                    unitConversion = (Single) foodItemServingSize.Unit.FromUnitConversions.Single(c => c.ToUnit == recipeUnit).Ratio;
                }

                // This gets us everything but the last bit.
                var nutrientPerRecipeRatio = recipeQuantity / unitConversion / foodItemServingSize.Quantity;

                foreach (var nutrient in foodItem.FoodItemNutrients) {
                    var nutrientPerRecipe = nutrient.Quantity * nutrientPerRecipeRatio;
                    Console.Out.WriteLine("{0} of {1} from {2}", nutrientPerRecipe, nutrient.Nutrient.Name, foodItem.Name);
                }
            }
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
                      , QuantityUnitType = ri.Unit.UnitType
                      , QuantityUnitName = ri.Unit.UnitName
                      , Quantity = ri.Quantity
                      , QuantityUnitTypeOptions = ri.FoodItem.ServingSizes.Select(s => s.Unit.UnitType).Distinct().ToArray()
                    }
                ).ToArray()
              , AmountsMade = (null == recipe.AmountsMade) ? [] : recipe.AmountsMade.OrderBy(am => am.DisplayOrder).Select(am =>
                    new RecipeModel.AmountMade {
                        Quantity = am.Quantity
                      , QuantityUnitId = am.Unit.Id
                      , QuantityUnitName = am.Unit.UnitName
                      , QuantityUnitType = am.Unit.UnitType
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
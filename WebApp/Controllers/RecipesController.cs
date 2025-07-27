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
            };

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

        private async Task PopulateRecipe(RecipeModel model, Recipe recipe)
        {
            recipe.Name = model.Name;
            recipe.Source = model.Source;
            
            await PopulateRecipeIngredients(model, recipe);

            await this._context.SaveChangesAsync();
        }

        private static RecipeModel ConvertEntityToModel(Recipe recipe)
        {
            return new RecipeModel {
                Id = recipe.Id
              , Name = recipe.Name
              , Source = recipe.Source
              , Ingredients = (null == recipe.RecipeIngredients) ? [] : recipe.RecipeIngredients.Select(ri =>
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
            };
        }

        private async Task PopulateRecipeIngredients(RecipeModel model, Recipe recipe)
        {
            List<RecipeModel.Ingredient> ingredientModels = model.Ingredients.ToList();
            List<RecipeIngredient> existingRecipeIngredients = recipe.RecipeIngredients.ToList();

            foreach (var i in ingredientModels.Select((x, i) => new { IngredientModel = x, Index = (Int16) i})) {
                var ingredientModel = i.IngredientModel;
                var existingRecipeIngredient = existingRecipeIngredients.SingleOrDefault(ri => ri.Id == ingredientModel.FoodItemId);

                FoodItem foodItem = await _context.FoodItems.SingleOrDefaultAsync(u => u.Id == ingredientModel.FoodItemId);

                if (null == foodItem) {
                    throw new SnackAndTrackControllerException($"Searched for food item {ingredientModel.FoodItemId} but 0 or multiple.");
                }

                Unit unit = await _context.Units.SingleOrDefaultAsync(u => u.Id == ingredientModel.QuantityUnitId);

                if (null == unit) {
                    throw new SnackAndTrackControllerException($"Searched for unit {ingredientModel.QuantityUnitId} but 0 or multiple.");
                }

                if (null == existingRecipeIngredient) {
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
                    existingRecipeIngredient.FoodItem = foodItem;
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
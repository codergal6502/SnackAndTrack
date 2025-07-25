using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.DatabaseAccess.Entities;
using SnackAndTrack.WebApp.Models;

namespace SnackAndTrack.WebApp.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class FoodItemsController : ControllerBase {
        private readonly SnackAndTrackDbContext _context;

        public FoodItemsController(SnackAndTrackDbContext context) {
            this._context = context;
        }

        // GET: api/FoodItems
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FoodItemModel>>> GetFoodItems() {
            return await FoodItemBaseQuery()
                .Select(
                    fi => ConvertEntityToModel(fi)
                )
                .ToListAsync();
        }

        // GET: api/FoodItems/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FoodItemModel>> GetFoodItem(Guid id)
        {
            var foodItem = await FoodItemBaseQuery()
                .SingleOrDefaultAsync(fi => fi.Id == id);

            if (foodItem == null)
            {
                return NotFound();
            }

            return ConvertEntityToModel(foodItem);
        }

        private IQueryable<FoodItem> FoodItemBaseQuery()
        {
            // The auto-refactor wanted this to return IIncludableQueryable<FoodItem, Unit>,
            // but that is to specific.
            return this
                ._context
                .FoodItems
                .Include(fi => fi.FoodItemNutrients).ThenInclude(fin => fin.Nutrient)
                .Include(fi => fi.ServingSizes).ThenInclude(s => s.Unit);
        }

        private static FoodItemModel ConvertEntityToModel(FoodItem foodItem)
        {
            return new FoodItemModel
            {
                Id = foodItem.Id
              , Name = foodItem.Name
              , Brand = foodItem.Brand
              , Nutrients = foodItem.FoodItemNutrients.Select(fin => new FoodItemModel.Nutrient
                {
                    Name = fin.Nutrient.Name
                  , Quantity = fin.Quantity
                }).ToArray()
              , ServingSizes = foodItem.ServingSizes.Select(s => new FoodItemModel.ServingSize {
                    UnitId = s.Unit.Id
                  , Quantity = s.Quantity
                }).ToArray()
            };
        }

        // POST: api/FoodItems
        [HttpPost]
        public async Task<ActionResult<FoodItemModel>> PostFoodItem(FoodItemModel model) {
            FoodItem foodItem = new FoodItem {
                Id = Guid.NewGuid()
              , Brand = model.Brand
              , Name = model.Name
              , FoodItemNutrients = []
              , ServingSizes = []
            };

            this._context.Add(foodItem);

            await PopulateFoodItem(model, foodItem);

            return CreatedAtAction(nameof(GetFoodItem), new { id = foodItem.Id }, ConvertEntityToModel(foodItem));
        }

        // PUT: api/FoodItems/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFoodItem(Guid id, FoodItemModel model)
        {
            if (id != model.Id)
            {
                return BadRequest();
            }

            FoodItem foodItem = await this
                ._context
                .FoodItems
                .Include(fi => fi.FoodItemNutrients)
                .ThenInclude(fin => fin.Nutrient)
                .SingleAsync(fi => fi.Id == id);

            if (null == foodItem)
            {
                return NotFound();
            }

            await PopulateFoodItem(model, foodItem);

            return NoContent();
        }

        private async Task PopulateFoodItem(FoodItemModel model, FoodItem foodItem)
        {
            List<FoodItemModel.Nutrient> nutritionModels = model.Nutrients.ToList();
            List<FoodItemNutrient> existingFoodItemNutrients = foodItem.FoodItemNutrients.ToList();

            foreach (var nutritionModel in nutritionModels)
            {
                var existingFoodItemNutrient = existingFoodItemNutrients.SingleOrDefault(fin => fin.Nutrient.Name == nutritionModel.Name);

                if (null == existingFoodItemNutrient)
                {
                    Nutrient nutrient = await _context.Nutrients.SingleOrDefaultAsync(n => n.Name == nutritionModel.Name);

                    if (null == nutrient)
                    {
                        nutrient = new Nutrient
                        {
                            Id = Guid.NewGuid()
                          , Name = nutritionModel.Name
                          , FoodItemNutrients = []
                        };

                        this._context.Add(nutrient);
                    }

                    foodItem.FoodItemNutrients.Add(new FoodItemNutrient
                    {
                        Id = new Guid()
                      , FoodItem = foodItem
                      , Nutrient = nutrient
                      , Quantity = nutritionModel.Quantity
                    });
                }
                else
                {
                    existingFoodItemNutrient.Quantity = nutritionModel.Quantity;

                    // Any that are left should be removed.
                    existingFoodItemNutrients.Remove(existingFoodItemNutrient);
                }
            }

            // Any that are left should be removed.
            foreach (var fin in existingFoodItemNutrients)
            {
                foodItem.FoodItemNutrients.Remove(fin);
                this._context.Remove(fin);
            }

            await this._context.SaveChangesAsync();
        }

        // DELETE: api/FoodItems/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFoodItem(Guid id)
        {
            var foodItem = await this._context.FoodItems.FindAsync(id);
            if (foodItem == null)
            {
                return NotFound();
            }

            this._context.FoodItems.Remove(foodItem);
            await this._context.SaveChangesAsync();

            return NoContent();
        }
    }
}
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
        public async Task<ActionResult<IEnumerable<FoodItemModel>>> GetFoodItems([FromQuery] String? q, [FromQuery] String? qName, [FromQuery] String? qBrand) {
            IQueryable<FoodItem> foodItems = this._context.FoodItems;

            if (!String.IsNullOrWhiteSpace(q)) {
                q = q.Trim().ToLower();
                foodItems = foodItems.Where(fi => fi.Name.ToLower().Contains(q) || fi.Brand.ToLower().Contains(q));
            }

            if (!String.IsNullOrWhiteSpace(qName)) {
                qName = qName.Trim().ToLower();
                foodItems = foodItems.Where(fi => fi.Name.ToLower().Contains(qName));
            }

            if (!String.IsNullOrWhiteSpace(qBrand)) {
                qBrand = qBrand.Trim().ToLower();
                foodItems = foodItems.Where(fi => fi.Brand.ToLower().Contains(qBrand));
            }

            return await foodItems
                .Select(
                    fi => ConvertEntityToModel(fi)
                )
                .ToListAsync();
        }

        // GET: api/FoodItems/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FoodItemModel>> GetFoodItem(Guid id)
        {
            var foodItem = await SingleFoodItemBaseQuery()
                .SingleOrDefaultAsync(fi => fi.Id == id);

            if (foodItem == null)
            {
                return NotFound();
            }

            return ConvertEntityToModel(foodItem);
        }

        private IQueryable<FoodItem> SingleFoodItemBaseQuery()
        {
            // The auto-refactor wanted this to return IIncludableQueryable<FoodItem, Unit>,
            // but that is to specific.
            return this
                ._context
                .FoodItems
                .Include(fi => fi.FoodItemNutrients.OrderBy(fin => fin.DisplayOrder)).ThenInclude(fin => fin.Nutrient)
                .Include(fi => fi.ServingSizes.OrderBy(s => s.DisplayOrder)).ThenInclude(s => s.Unit);
        }

        private static FoodItemModel ConvertEntityToModel(FoodItem foodItem)
        {
            return new FoodItemModel
            {
                Id = foodItem.Id
              , Name = foodItem.Name
              , Brand = foodItem.Brand
              , Nutrients = (null == foodItem.FoodItemNutrients) ? [] : foodItem.FoodItemNutrients.Select(fin => new FoodItemModel.Nutrient
                {
                    Name = fin.Nutrient.Name
                  , Quantity = fin.Quantity
                }).ToArray()
              , ServingSizes = (null == foodItem.ServingSizes) ? [] : foodItem.ServingSizes.Select(s => new FoodItemModel.ServingSize {
                    UnitId = s.Unit.Id
                  , UnitType = s.Unit.UnitType
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

            FoodItem foodItem = await SingleFoodItemBaseQuery()
                .SingleAsync(fi => fi.Id == id);

            if (null == foodItem)
            {
                return NotFound();
            }

            await PopulateFoodItem(model, foodItem);

            await this._context.SaveChangesAsync();

            return NoContent();
        }

        private async Task PopulateFoodItem(FoodItemModel model, FoodItem foodItem)
        {
            foodItem.Name = model.Name.Trim();
            foodItem.Brand = model.Brand.Trim();

            await PopulateServingSizes(model, foodItem);
            await PopulateFoodItemNutrients(model, foodItem);

            await this._context.SaveChangesAsync();
        }

        private async Task PopulateServingSizes(FoodItemModel model, FoodItem foodItem) {
            List<FoodItemModel.ServingSize> servingSizeModels = model.ServingSizes.ToList();
            List<ServingSize> existingServingSizes = foodItem.ServingSizes.ToList();

            foreach (var i in servingSizeModels.Select((x, i) => new { ServingSizeModel = x, Index = (Int16) i})) {
                var servingSizeModel = i.ServingSizeModel;
                var existingServingSize = existingServingSizes.SingleOrDefault(s => s.Unit.Id == servingSizeModel.UnitId);

                Unit? unit = await _context.Units.SingleOrDefaultAsync(u => u.Id == servingSizeModel.UnitId);

                if (null == unit) {
                    throw new SnackAndTrackControllerException($"Searched for unit {servingSizeModel.UnitId} but 0 or multiple.");
                }

                if (null == existingServingSize) {

                    ServingSize servingSize = new ServingSize { Id = Guid.NewGuid(), FoodItem = foodItem, Quantity = servingSizeModel.Quantity, Unit = unit, DisplayOrder =  i.Index };
                    this._context.Add(servingSize);
                    foodItem.ServingSizes.Add(servingSize);
                }
                else {
                    existingServingSize.Unit = unit;
                    existingServingSize.Quantity = servingSizeModel.Quantity;
                    existingServingSize.DisplayOrder = i.Index;

                    // Any that are left at the end should be removed from the database.
                    existingServingSizes.Remove(existingServingSize);
                }
            }

            // Any that are left at the end should be removed from the database.
            foreach (var s in existingServingSizes)
            {
                foodItem.ServingSizes.Remove(s);
                this._context.Remove(s);
            }
        }

        private async Task PopulateFoodItemNutrients(FoodItemModel model, FoodItem foodItem)
        {
            List<FoodItemModel.Nutrient> nutrientModels = model.Nutrients.ToList();
            List<FoodItemNutrient> existingFoodItemNutrients = foodItem.FoodItemNutrients.ToList();

            foreach (var i in nutrientModels.Select((x, i) => new { NutrientModel = x, Index = (Int16) i }))
            // foreach (var nutritionModel in nutrientModels)
            {
                var nutritionModel = i.NutrientModel;
                var existingFoodItemNutrient = existingFoodItemNutrients.SingleOrDefault(fin => fin.Nutrient.Name == nutritionModel.Name);

                if (null == existingFoodItemNutrient)
                {
                    Nutrient nutrient = await _context.Nutrients.SingleAsync(n => n.Name == nutritionModel.Name);

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
                      , DisplayOrder = i.Index
                    });
                }
                else
                {
                    existingFoodItemNutrient.Quantity = nutritionModel.Quantity;
                    existingFoodItemNutrient.DisplayOrder = i.Index;

                    // Any that are left at the end should be removed from the database.
                    existingFoodItemNutrients.Remove(existingFoodItemNutrient);
                }
            }

            // Any that are left at the end should be removed from the database.
            foreach (var fin in existingFoodItemNutrients)
            {
                foodItem.FoodItemNutrients.Remove(fin);
                this._context.Remove(fin);
            }
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
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.Data;
using SnackAndTrack.Models;

namespace SnackAndTrack.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class FoodItemsController : ControllerBase
    {
        private readonly SnackAndTrackDbContext _context;

        public FoodItemsController(SnackAndTrackDbContext context)
        {
            this._context = context;
        }

        // GET: api/FoodItems
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FoodItem>>> GetFoodItems()
        {
            return await this._context.FoodItems.ToListAsync();
        }

        // GET: api/FoodItems/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FoodItem>> GetFoodItem(Guid id)
        {
            var foodItem = await this._context.FoodItems.FindAsync(id);

            if (foodItem == null)
            {
                return NotFound();
            }

            await this._context.Entry(foodItem).Collection(fi => fi.FoodItemNutrients).LoadAsync();

            return foodItem;
        }

        // POST: api/FoodItems
        [HttpPost]
        public async Task<ActionResult<FoodItem>> PostFoodItem(FoodItem foodItem)
        {
            this._context.FoodItems.Add(foodItem);
            await this._context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFoodItem), new { id = foodItem.Id }, foodItem);
        }

        // PUT: api/FoodItems/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFoodItem(Guid id, FoodItem foodItem)
        {
            if (id != foodItem.Id)
            {
                return BadRequest();
            }

            this._context.Entry(foodItem).State = EntityState.Modified;

            try
            {
                await this._context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FoodItemExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
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

        private bool FoodItemExists(Guid id)
        {
            return _context.FoodItems.Any(e => e.Id == id);
        }
    }

}
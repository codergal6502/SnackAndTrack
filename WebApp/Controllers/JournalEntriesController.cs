using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.DatabaseAccess.Entities;
using SnackAndTrack.WebApp.Models;

namespace SnackAndTrack.WebApp.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class JournalEntriesController : ControllerBase {
        private readonly SnackAndTrackDbContext _context;

        public JournalEntriesController(SnackAndTrackDbContext context) {
            this._context = context;
        }

        // GET: /api/JournalEntries/55555555-5555-5555-5555-555555555555
        [HttpGet("{id}")]
        public async Task<ActionResult<JournalEntryModel>> Get(Guid id) {
            FoodJournalEntry? foodJournalEntry =
                await _context
                    .FoodJournalEntries
                    .Include(fje => fje.FoodItem)
                    .Include(fje => fje.Unit)
                    .SingleOrDefaultAsync(fje => fje.Id == id);

            if (null == foodJournalEntry)
            {
                return NotFound(new { id });
            }

            return Ok(
                new JournalEntryModel {
                    Id = foodJournalEntry.Id
                  , Date = foodJournalEntry.Date
                  , Time = foodJournalEntry.Time
                  , Quantity = foodJournalEntry.Quantity
                  , FoodItemId = foodJournalEntry.FoodItem.Id
                  , UnitId = foodJournalEntry.Unit.Id
                }
            );
        }

        // POST: api/JournalEntries
        [HttpPost]
        public async Task<ActionResult<Object>> Post(JournalEntryModel model) {
            if (null != model.Id) {
                return BadRequest();
            }

            var unit = await _context.Units.SingleAsync(u => u.Id == model.UnitId);
            var foodItem = await _context.FoodItems.SingleAsync(fi => fi.Id == model.FoodItemId);

            FoodJournalEntry foodJournalEntry = new FoodJournalEntry {
                Id = Guid.NewGuid()
              , Unit = unit
              , FoodItem = foodItem
              , Date = model.Date
              , Time = model.Time
              , Quantity = model.Quantity
            };

            _context.FoodJournalEntries.Add(foodJournalEntry);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = foodJournalEntry.Id }, new { id = foodJournalEntry.Id });
        }

        // PUT: api/JournalEntries/55555555-5555-5555-5555-555555555555
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(Guid id, JournalEntryModel model) {
            if (id != model.Id) {
                return BadRequest();
            }

            FoodJournalEntry? foodJournalEntry = await _context.FoodJournalEntries.FindAsync(id);

            if (null == foodJournalEntry) {
                return NotFound(new { id });
            }

            var unit = await _context.Units.SingleAsync(u => u.Id == model.UnitId);
            var foodItem = await _context.FoodItems.SingleAsync(fi => fi.Id == model.FoodItemId);

            foodJournalEntry.Unit = unit;
            foodJournalEntry.FoodItem = foodItem;
            foodJournalEntry.Date = model.Date;
            foodJournalEntry.Time = model.Time;
            foodJournalEntry.Quantity = model.Quantity;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/JournalEntries/55555555-5555-5555-5555-555555555555
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            FoodJournalEntry? foodJournalEntry = await _context.FoodJournalEntries.FindAsync(id);

            if (null == foodJournalEntry)
            {
                return NotFound(new { id });
            }

            _context.Remove(foodJournalEntry);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
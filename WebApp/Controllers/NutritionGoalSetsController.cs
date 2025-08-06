using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.DatabaseAccess.Entities;
using SnackAndTrack.WebApp.Models;

namespace SnackAndTrack.WebApp.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class NutritionGoalSetsController : ControllerBase {
        private readonly SnackAndTrackDbContext _context;

        public NutritionGoalSetsController(SnackAndTrackDbContext context) {
            this._context = context;
        }

        // GET: api/NutritionGoalSets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NutritionGoalSetModel>>> GetNutritionGoalSets([FromQuery] String? q) {
            throw new NotImplementedException();
        }

        // GET: api/NutritionGoalSets/55555555-5555-5555-5555-555555555555
        [HttpGet("{id}")]
        public async Task<ActionResult<NutritionGoalSetModel>> GetNutritionGoalSet(Guid id)
        {
            throw new NotImplementedException();
        }

        private IQueryable<Object> SingleNutritionGoalSet()
        {
            // // The auto-refactor wanted this to return IIncludableQueryable<NutritionGoalSet, Unit>,
            // // but that is to specific.
            // return this
            //     ._context
            //     .NutritionGoalSets
            //     .Include(fi => fi.GeneratedFrom)
            //     .Include(fi => fi.NutritionGoalSetNutrients.OrderBy(fin => fin.DisplayOrder)).ThenInclude(fin => fin.Nutrient)
            //     .Include(fi => fi.NutritionGoalSetNutrients.OrderBy(fin => fin.DisplayOrder)).ThenInclude(fin => fin.Unit)
            //     .Include(fi => fi.ServingSizes.OrderBy(s => s.DisplayOrder)).ThenInclude(s => s.Unit);
            throw new NotImplementedException();
        }

        private static NutritionGoalSetModel ConvertEntityToModel(Object nutritionGoalSet)
        {
            throw new NotImplementedException();
        }

        // POST: api/NutritionGoalSets
        [HttpPost]
        public async Task<ActionResult<Object>> PostNutritionGoalSet(NutritionGoalSetModel model) {
            throw new NotImplementedException();
        }

        // PUT: api/NutritionGoalSets/55555555-5555-5555-5555-555555555555
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNutritionGoalSet(Guid id, NutritionGoalSetModel model)
        {
            throw new NotImplementedException();
        }

        private async Task PopulateNutritionGoalSetModel(NutritionGoalSetModel model, Object nutritionGoalSetModel)
        {
            throw new NotImplementedException();
            // NutritionGoalSet.Name = model.Name.Trim();
            // NutritionGoalSet.Brand = model.Brand.Trim();

            // await PopulateServingSizes(model, NutritionGoalSet);
            // await PopulateNutritionGoalSetNutrients(model, NutritionGoalSet);
        }

        // DELETE: api/NutritionGoalSets/55555555-5555-5555-5555-555555555555
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNutritionGoalSet(Guid id)
        {
            throw new NotImplementedException();
            // var NutritionGoalSet = await this._context.NutritionGoalSets.FindAsync(id);
            // if (NutritionGoalSet == null)
            // {
            //     return NotFound();
            // }

            // this._context.NutritionGoalSets.Remove(NutritionGoalSet);
            // await this._context.SaveChangesAsync();

            // return NoContent();
        }
    }
}
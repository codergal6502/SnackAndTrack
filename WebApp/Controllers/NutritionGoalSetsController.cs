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
        public async Task<ActionResult<NutritionGoalSetModel>> GetNutritionGoalSet(Guid id) {
            NutritionGoalSet? nutritionGoalSet =
                await this
                    ._context
                    .NutritionGoalSets
                    .Include(ngs => ngs.NutritionGoalSetDayModes)
                    .Include(ngs => ngs.NutritionGoalSetNutrients).ThenInclude(ngsn => ngsn.Nutrient)
                    .Include(ngs => ngs.NutritionGoalSetNutrients).ThenInclude(ngsn => ngsn.NutritionGoalSetNutrientTargets)
                    .SingleOrDefaultAsync(ngs => ngs.Id == id);

            if (null == nutritionGoalSet) {
                return NotFound();
            }
            else {
                return ConvertEntityToModel(nutritionGoalSet);
            }
        }

        private IQueryable<Object> SingleNutritionGoalSet() {
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

        // POST: api/NutritionGoalSets
        [HttpPost]
        public async Task<ActionResult<Object>> PostNutritionGoalSet(NutritionGoalSetModel model) {
            var nutrientIds = model.Nutrients.Select(n => n.NutrientId);
            await this._context.Nutrients.LoadAsync();

            NutritionGoalSet nutritionGoalSet = new NutritionGoalSet {
                Id = Guid.NewGuid()
              , Name = model.Name
              , StartDate = DateOnly.FromDateTime(model.StartDate ?? throw new SnackAndTrackControllerException("Cannot create nutrition goal set with no start date."))
              , EndDate = model.EndDate.HasValue ? DateOnly.FromDateTime(model.EndDate.Value) : null
              , Period = model.Period
              , NutritionGoalSetDayModes = []
              , NutritionGoalSetNutrients = []
            };

            this._context.Add(nutritionGoalSet);
            await PopulateCollections(model, nutritionGoalSet);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(NutritionGoalSet), new { nutritionGoalSet.Id }, ConvertEntityToModel(nutritionGoalSet));
        }

        private async Task PopulateCollections(NutritionGoalSetModel model, NutritionGoalSet nutritionGoalSet)
        {
            PopulateDayModes(model, nutritionGoalSet);
            await PopulateNutrients(model, nutritionGoalSet);
        }

        // PUT: api/NutritionGoalSets/55555555-5555-5555-5555-555555555555
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNutritionGoalSet(Guid id, NutritionGoalSetModel model) {
            throw new NotImplementedException();
        }

        // DELETE: api/NutritionGoalSets/55555555-5555-5555-5555-555555555555
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNutritionGoalSet(Guid id) {
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

        private void PopulateDayModes(NutritionGoalSetModel model, NutritionGoalSet nutritionGoalSet) {
            foreach(var dm in model.DayModes) {
                var dayMode = new NutritionGoalSetDayMode {
                    Id = Guid.NewGuid()
                  , Type = Enum.Parse<NutritionGoalSetDayMode.DayModeType>(dm.Type.ToString()) // See https://stackoverflow.com/a/1818149
                };

                nutritionGoalSet.NutritionGoalSetDayModes.Add(dayMode);
                this._context.Add(dayMode);
            }         
        }

        private async Task PopulateNutrients(NutritionGoalSetModel model, NutritionGoalSet nutritionGoalSet) {
            foreach (var n in model.Nutrients) {
                var ngsNutrient = new NutritionGoalSetNutrient {
                    Id = Guid.NewGuid()
                  , Nutrient = await this._context.Nutrients.FindAsync(n.NutrientId) ?? throw new SnackAndTrackControllerException($"Could not find nutrient with ID {n.NutrientId}.")
                  , NutritionGoalSetNutrientTargets = []
                };

                nutritionGoalSet.NutritionGoalSetNutrients.Add(ngsNutrient);
                this._context.Add(ngsNutrient);
                
                foreach(var kvp in n.Targets) {
                    var target = new NutritionGoalSetNutrientTarget {
                        Id = Guid.NewGuid()
                      , Minimum = kvp.Value.Minimum
                      , Maximum = kvp.Value.Maximum
                      , Start = kvp.Value.Start
                      , End = kvp.Value.End
                    };

                    ngsNutrient.NutritionGoalSetNutrientTargets.Add(target);
                    this._context.Add(target);
                }
            }
        }

        private static NutritionGoalSetModel ConvertEntityToModel(NutritionGoalSet nutritionGoalSet) {
            return new NutritionGoalSetModel {
                Id = nutritionGoalSet.Id
              , Name = nutritionGoalSet.Name
              , StartDate = nutritionGoalSet.StartDate.ToDateTime(new TimeOnly(0))
              , EndDate = nutritionGoalSet.EndDate?.ToDateTime(new TimeOnly(0))
              , Period = nutritionGoalSet.Period
              , DayModes = nutritionGoalSet.NutritionGoalSetDayModes.Select(dm => new NutritionGoalSetModel.DayMode {
                    Type = Enum.Parse<NutritionGoalSetModel.DayMode.DayModeEnum>(dm.Type.ToString())
                }).ToList()
              , Nutrients = nutritionGoalSet.NutritionGoalSetNutrients.Select(ngsn => new NutritionGoalSetModel.Nutrient {
                    NutrientId = ngsn.Nutrient.Id,
                    Targets = ngsn.NutritionGoalSetNutrientTargets.ToDictionary(nt => nt.Start, nt => new NutritionGoalSetModel.Nutrient.Target {
                        Minimum = nt.Minimum,
                        Maximum = nt.Maximum,
                        Start = nt.Start,
                        End = nt.End
                    })
                }).ToList()
            };
        }
    }
}
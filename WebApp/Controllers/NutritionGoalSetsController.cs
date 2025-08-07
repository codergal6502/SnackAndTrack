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
        public async Task<ActionResult<IEnumerable<NutritionGoalSetModel>>> GetNutritionGoalSets([FromQuery] String? q, [FromQuery] String? qName) {
            IQueryable<NutritionGoalSet> nutritionGoalSets = InclusiveQueryable();

            if (!String.IsNullOrWhiteSpace(q)) {
                q = q.Trim().ToLower();
                nutritionGoalSets = nutritionGoalSets.Where(s => s.Name.ToLower().Contains(q));
            }

            if (!String.IsNullOrWhiteSpace(qName)) {
                qName = qName.Trim().ToLower();
                nutritionGoalSets = nutritionGoalSets.Where(s => s.Name.ToLower().Contains(qName));
            }

            return await nutritionGoalSets.Select(s => ConvertEntityToModel(s)).ToListAsync();
        }

        // GET: api/NutritionGoalSets/55555555-5555-5555-5555-555555555555
        [HttpGet("{id}")]
        public async Task<ActionResult<NutritionGoalSetModel>> GetNutritionGoalSet(Guid id) {
            NutritionGoalSet? nutritionGoalSet = await GetSingleNutritionGoalSet(id);

            if (null == nutritionGoalSet) {
                return NotFound();
            }
            else {
                return ConvertEntityToModel(nutritionGoalSet);
            }
        }

        private async Task<NutritionGoalSet?> GetSingleNutritionGoalSet(Guid id)
        {
            return await InclusiveQueryable().SingleOrDefaultAsync(ngs => ngs.Id == id);
        }

        private IQueryable<NutritionGoalSet> InclusiveQueryable()
        {
            return this
                ._context
                .NutritionGoalSets
                .Include(ngs => ngs.NutritionGoalSetDayModes.OrderBy(ngsdm => ngsdm.DayNumber))
                .Include(ngs => ngs.NutritionGoalSetNutrients).ThenInclude(ngsn => ngsn.Nutrient)
                .Include(ngs => ngs.NutritionGoalSetNutrients).ThenInclude(ngsn => ngsn.NutritionGoalSetNutrientTargets);
        }

        // POST: api/NutritionGoalSets
        [HttpPost]
        public async Task<ActionResult<Object>> PostNutritionGoalSet(NutritionGoalSetModel model) {
            await this._context.Nutrients.LoadAsync();

            NutritionGoalSet nutritionGoalSet = new NutritionGoalSet {
                Id = Guid.NewGuid()
              , Name = model.Name
              , StartDate = model.StartDate
              , EndDate = model.EndDate.HasValue ? model.EndDate.Value : null
              , Period = model.Period
              , NutritionGoalSetDayModes = []
              , NutritionGoalSetNutrients = []
            };

            this._context.Add(nutritionGoalSet);
            await PopulateCollections(model, nutritionGoalSet);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(NutritionGoalSet), new { nutritionGoalSet.Id }, ConvertEntityToModel(nutritionGoalSet));
        }

        // PUT: api/NutritionGoalSets/55555555-5555-5555-5555-555555555555
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNutritionGoalSet(Guid id, NutritionGoalSetModel model) {
            if (id != model.Id) {
                return BadRequest();    
            }

            await this._context.Nutrients.LoadAsync();
            var nutritionGoalSet = await GetSingleNutritionGoalSet(id);

            if (null == nutritionGoalSet) {
                return NotFound();
            }

            nutritionGoalSet.Name = model.Name;
            nutritionGoalSet.StartDate = model.StartDate;
            nutritionGoalSet.EndDate = model.EndDate;
            nutritionGoalSet.Period = model.Period;

            await PopulateCollections(model, nutritionGoalSet);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/NutritionGoalSets/55555555-5555-5555-5555-555555555555
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNutritionGoalSet(Guid id) {
            // To cascade the delete at the entity-framework level, you have
            // to load the entire object graph, since the delete only cascades
            // one level by default.
            var nutritionGoalSet = await GetSingleNutritionGoalSet(id);
            if (nutritionGoalSet == null)
            {
                return NotFound();
            }

            this._context.NutritionGoalSets.Remove(nutritionGoalSet);
            await this._context.SaveChangesAsync();

            return NoContent();
        }

        private void PopulateDayModes(NutritionGoalSetModel model, NutritionGoalSet nutritionGoalSet) {
            var ngsDmsToRemove = nutritionGoalSet.NutritionGoalSetDayModes.ToList();

            for (var index = 0; index < model.DayModes.Count; index++) {
                var dayNumber = (Int16) (index + 1);
                var dm = model.DayModes[index];
                var ngsDayMode = nutritionGoalSet.NutritionGoalSetDayModes.SingleOrDefault(ngsdm => dayNumber == ngsdm.DayNumber);
                
                if (null == ngsDayMode) {
                    ngsDayMode = new NutritionGoalSetDayMode {
                        Id = Guid.NewGuid()
                      , Type = Enum.Parse<NutritionGoalSetDayMode.DayModeType>(dm.Type.ToString()) // See https://stackoverflow.com/a/1818149
                      , DayNumber = dayNumber
                    };

                    nutritionGoalSet.NutritionGoalSetDayModes.Add(ngsDayMode);
                    this._context.Add(ngsDayMode);
                }
                else {
                    ngsDayMode.Type = Enum.Parse<NutritionGoalSetDayMode.DayModeType>(dm.Type.ToString()); // See https://stackoverflow.com/a/1818149
                    ngsDmsToRemove.Remove(ngsDayMode);
                }
            }
            
            foreach (var ngsDm in ngsDmsToRemove) {
                nutritionGoalSet.NutritionGoalSetDayModes.Remove(ngsDm);
                this._context.Remove(ngsDm);
            }
        }

        private async Task PopulateCollections(NutritionGoalSetModel model, NutritionGoalSet nutritionGoalSet)
        {
            PopulateDayModes(model, nutritionGoalSet);
            await PopulateNutrients(model, nutritionGoalSet);
        }

        private async Task PopulateNutrients(NutritionGoalSetModel model, NutritionGoalSet nutritionGoalSet) {
            var nutrientsToRemove = nutritionGoalSet.NutritionGoalSetNutrients.ToList();
            
            foreach (var n in model.Nutrients) {
                var ngsNutrient = nutritionGoalSet.NutritionGoalSetNutrients.SingleOrDefault(ngsn => ngsn.Nutrient.Id == n.NutrientId);
                
                if (null == ngsNutrient) {
                    ngsNutrient = new NutritionGoalSetNutrient {
                        Id = Guid.NewGuid()
                      , Nutrient = await this._context.Nutrients.FindAsync(n.NutrientId) ?? throw new SnackAndTrackControllerException($"Could not find nutrient with ID {n.NutrientId}.")
                      , NutritionGoalSetNutrientTargets = []
                    };

                    nutritionGoalSet.NutritionGoalSetNutrients.Add(ngsNutrient);
                    this._context.Add(ngsNutrient);
                }
                else {
                    // That is, keep the nutrient in the goal.
                    nutrientsToRemove.Remove(ngsNutrient);
                }

                var targetsToRemove = ngsNutrient.NutritionGoalSetNutrientTargets.ToList();
                
                foreach (var kvp in n.Targets)
                {
                    var target = ngsNutrient.NutritionGoalSetNutrientTargets.SingleOrDefault(t => t.Start == kvp.Value.Start);
                    
                    if (null == target) {
                        target = new NutritionGoalSetNutrientTarget
                        {
                            Id = Guid.NewGuid()
                          , Minimum = kvp.Value.Minimum
                          , Maximum = kvp.Value.Maximum
                          , Start = kvp.Value.Start
                          , End = kvp.Value.End
                        };

                        ngsNutrient.NutritionGoalSetNutrientTargets.Add(target);
                        this._context.Add(target);
                    }
                    else {
                        target.Minimum = kvp.Value.Minimum;
                        target.Maximum = kvp.Value.Maximum;
                        target.End = kvp.Value.End;

                        targetsToRemove.Remove(target);
                    }
                }
                
                foreach (var targetToRemove in targetsToRemove) {
                    ngsNutrient.NutritionGoalSetNutrientTargets.Remove(targetToRemove);
                    this._context.Remove(targetToRemove);
                }
            }
            
            foreach (var nutrientToRemove in nutrientsToRemove) {
                nutritionGoalSet.NutritionGoalSetNutrients.Remove(nutrientToRemove);
                this._context.Remove(nutrientToRemove);
            }
        }

        private static NutritionGoalSetModel ConvertEntityToModel(NutritionGoalSet nutritionGoalSet) {
            return new NutritionGoalSetModel {
                Id = nutritionGoalSet.Id
              , Name = nutritionGoalSet.Name
              , StartDate = nutritionGoalSet.StartDate
              , EndDate = nutritionGoalSet.EndDate
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
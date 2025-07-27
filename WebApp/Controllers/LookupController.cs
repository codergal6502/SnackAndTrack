using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.DatabaseAccess.Entities;
using SnackAndTrack.WebApp.Models;

namespace SnackAndTrack.WebApp.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class LookupController : ControllerBase {
        private readonly SnackAndTrackDbContext _context;

        public LookupController(SnackAndTrackDbContext context) {
            this._context = context;
        }

        [HttpGet("nutrients")]
        public async Task<ActionResult<IEnumerable<Nutrient>>> GetNutrients([FromQuery] String? query) {
            IQueryable<Nutrient> baseQuery = this._context.Nutrients.Include(n => n.DefaultUnit);
            if (String.IsNullOrWhiteSpace(query)) {
                return await baseQuery.ToListAsync();
            }
            else {
                query = query.Trim().ToLower();
                return await baseQuery.Where(n => n.Name.ToLower().Contains(query) || n.Group.ToLower().Contains(query)).ToListAsync();
            }
        }

        [HttpGet("unitTypes")]
        public async Task<ActionResult<IEnumerable<string>>> GetUnitTypes() {
            return await this._context.Units.Select(u => u.Type).Distinct().ToListAsync();
        }

        [HttpGet("units/{unitType}")]
        public async Task<ActionResult<IEnumerable<UnitModel>>> GetUnitsForType([FromRoute] String unitType) {
            return await this._context.Units.Where(u => u.Type == unitType).Distinct().Select(u => new UnitModel { 
                Id = u.Id
              , UnitName = u.Name
              , UnitType = u.Type
            }).ToListAsync();
        }

        [HttpGet("units")]
        public async Task<ActionResult<IEnumerable<Unit>>> GetUnits() {
            return await this._context.Units.ToListAsync();
        }
    }
}
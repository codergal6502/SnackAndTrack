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
        public async Task<ActionResult<IEnumerable<String>>> GetNutrients([FromQuery] String? query) {
            if (String.IsNullOrWhiteSpace(query)) {
                return await this._context.Nutrients.Select(n => n.Name).Distinct().ToListAsync();
            }
            else {
                query = query.Trim().ToLower();
                return await this._context.Nutrients.Where(n => n.Name.ToLower().Contains(query)).Select(n => n.Name).Distinct().ToListAsync();
            }
        }

        [HttpGet("unitTypes")]
        public async Task<ActionResult<IEnumerable<string>>> GetUnitTypes() {
            return await this._context.Units.Select(u => u.UnitType).Distinct().ToListAsync();
        }

        [HttpGet("units/{unitType}")]
        public async Task<ActionResult<IEnumerable<UnitModel>>> GetUnitsForType([FromRoute] String unitType) {
            return await this._context.Units.Where(u => u.UnitType == unitType).Distinct().Select(u => new UnitModel { 
                Id = u.Id
              , UnitName = u.UnitName
              , UnitType = u.UnitType
            }).ToListAsync();
        }

        [HttpGet("units")]
        public async Task<ActionResult<IEnumerable<Unit>>> GetUnits() {
            return await this._context.Units.ToListAsync();
        }
    }
}
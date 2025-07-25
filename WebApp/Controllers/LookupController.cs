using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.WebApp.Models;

namespace SnackAndTrack.WebApp.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class LookupController : ControllerBase {
        private readonly SnackAndTrackDbContext _context;

        public LookupController(SnackAndTrackDbContext context) {
            this._context = context;
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
    }
}
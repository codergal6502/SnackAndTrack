using System.ComponentModel.DataAnnotations;
using System.Diagnostics;

namespace SnackAndTrack.DatabaseAccess.Entities {
    [DebuggerDisplay("{FromUnit}/{ToUnit}={Ratio}")]
    public class UnitConversion {
        [Key]
        public virtual required Guid Id { get; set; }
        public virtual required Unit FromUnit { get; set; }
        public virtual required Single Ratio { get; set; }
        public virtual required Unit ToUnit { get; set; }
    }
}
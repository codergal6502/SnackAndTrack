using System.ComponentModel.DataAnnotations;

namespace SnackAndTrack.DatabaseAccess.Entities {
    public class UnitConversion {
        [Key]
        public virtual required Guid Id { get; set; }
        public virtual required Unit FromUnit { get; set; }
        public virtual required double Ratio { get; set; }
        public virtual required Unit ToUnit { get; set; }
    }
}
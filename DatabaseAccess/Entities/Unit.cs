using System.ComponentModel.DataAnnotations.Schema;

namespace SnackAndTrack.DatabaseAccess.Entities {
    public class Unit {
        public virtual required Guid Id { get; set; }
        public virtual required String UnitName  { get; set; }
        public virtual required String UnitType  { get; set; }
    
        [InverseProperty(nameof(UnitConversion.FromUnit))]
        public virtual required ICollection<UnitConversion> FromUnitConversions { get; set; }

        [InverseProperty(nameof(UnitConversion.ToUnit))]
        public virtual required ICollection<UnitConversion> ToUnitConversions { get; set; }
    }
}
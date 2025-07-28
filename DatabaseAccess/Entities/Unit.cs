using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;

namespace SnackAndTrack.DatabaseAccess.Entities {
    [DebuggerDisplay("{Name} ({Type})")]
    public class Unit {
        [Key]
        public virtual required Guid Id { get; set; }
        public virtual required String Name  { get; set; }
        public virtual required String Type  { get; set; }
        public virtual required String? AbbreviationCsv { get; set; }
        public virtual required Boolean CanBeFoodQuantity { get; set; }
        [InverseProperty(nameof(UnitConversion.FromUnit))]
        public virtual required ICollection<UnitConversion> FromUnitConversions { get; set; }

        [InverseProperty(nameof(UnitConversion.ToUnit))]
        public virtual required ICollection<UnitConversion> ToUnitConversions { get; set; }
    }
}
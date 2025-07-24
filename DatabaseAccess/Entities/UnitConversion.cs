namespace SnackAndTrack.DatabaseAccess.Entities {
    public class UnitConversion {
        public required Guid Id { get; set; }
        public required Unit FromUnit { get; set; }
        public required double Ratio { get; set; }
        public required Unit ToUnit { get; set; }
    }
}
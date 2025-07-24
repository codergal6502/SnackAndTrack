namespace SnackAndTrack.DatabaseAccess.Entities {
    public class Unit {
        public required Guid Id { get; set; }
        public required String UnitName  { get; set; }
        public required String UnitType  { get; set; }
    }
}
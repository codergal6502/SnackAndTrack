using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.Models {
    public class UnitModel {
        public Guid? Id { get; set; }
        public required String UnitName  { get; set; }
        public required String UnitType { get; set; }
    }
}
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.Models {
    public class UnitModel {
        public Guid? Id { get; set; }
        public required String Name  { get; set; }
        public required String Type { get; set; }
    }
}
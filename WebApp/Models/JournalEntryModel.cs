namespace SnackAndTrack.WebApp.Models {
    public class JournalEntryModel {
        public Guid? Id { get; set;  }
        public required Guid FoodItemId { get; set; }
        public required Guid UnitId { get; set; }
        public required Single Quantity { get; set; }
        public required TimeOnly? Time { get; set; }
        public required DateOnly Date { get; set; }
    }
}
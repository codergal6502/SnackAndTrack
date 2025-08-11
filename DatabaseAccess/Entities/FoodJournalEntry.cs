using System.Diagnostics;

namespace SnackAndTrack.DatabaseAccess.Entities {
    [DebuggerDisplay("{Date}: {Quantity} {Unit} {FoodItem}")]
    public class FoodJournalEntry
    {
        public virtual required Guid Id { get; set; }
        public virtual required DateOnly Date { get; set; }
        public virtual required TimeOnly? Time { get; set; }
        public virtual required Single Quantity { get; set; }
        public virtual required Unit Unit { get; set; }
        public virtual required FoodItem FoodItem { get; set; }
    }
}
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class FoodJournalEntriesResponse : PaginatedResponse<FoodJournalEntry> { }

    public class FoodJournalEntriesResponseGraphType : PaginatedItemsResponseType<FoodJournalEntry, FoodJournalEntryGraphType, FoodJournalEntriesResponse> {
        public FoodJournalEntriesResponseGraphType() : base("List of food journal entries.") { }
    }
    
    public enum FoodJournalEntriesortBy { Time, FoodItem }
}
using GraphQL.Types;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class FoodJournalEntryGraphType : ObjectGraphType<FoodJournalEntry> {
        public FoodJournalEntryGraphType() {
            Field(x => x.Id);
            Field(x => x.Date);
            Field(x => x.Time);
            Field(x => x.Quantity);
            Field<FoodItemGraphType>(nameof(FoodJournalEntry.FoodItem)).Resolve(c => c.Source.FoodItem);
            Field<UnitGraphType>(nameof(FoodJournalEntry.Unit)).Resolve(c => c.Source.Unit);
        }
    }
}
using GraphQL.Types;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl {
    public class UnitType : ObjectGraphType<Unit> {
        public UnitType() {
            Field(x => x.Id);
            Field(x => x.AbbreviationCsv);
            Field(x => x.Name);
            Field(x => x.Type);
        }
    }
}
using GraphQL.Types;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl {
    public class UnitGraphType : ObjectGraphType<Unit> {
        public UnitGraphType() {
            Field(x => x.Id);
            Field(x => x.AbbreviationCsv);
            Field(x => x.Name);
            Field(x => x.Type);
        }
    }
}
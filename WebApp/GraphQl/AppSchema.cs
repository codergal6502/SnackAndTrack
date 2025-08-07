using GraphQL.Types;

namespace SnackAndTrack.WebApp.GraphQl {
    public class AppSchema : Schema {
        public AppSchema(AppQuery query) {
            Query = query;
        }
    }
}
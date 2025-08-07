using GraphQL.Types;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl {
    public class NutrientGraphType : ObjectGraphType<Nutrient> {
        public NutrientGraphType() {
            Field(x => x.Id);
            Field(x => x.Name);
            Field<UnitGraphType>(nameof(Nutrient.DefaultUnit)).Resolve(context => context.Source.DefaultUnit);
            Field(x => x.CurrentDailyValue, nullable: true);
            Field(x => x.Group);
            Field(x => x.DisplayOrder);
        }
    }
}
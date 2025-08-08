using GraphQL.Types;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class UnitGraphType : ObjectGraphType<Unit> {
        public UnitGraphType() {
            Field(x => x.Id);
            Field(x => x.AbbreviationCsv);
            Field(x => x.Name);
            Field(x => x.Type);
            Field(x => x.CanBeFoodQuantity);
            Field<ListGraphType<UnitConversionGraphType>>(nameof(Unit.FromUnitConversions)).Resolve(x => x.Source.FromUnitConversions);
            Field<ListGraphType<UnitConversionGraphType>>(nameof(Unit.ToUnitConversions)).Resolve(x => x.Source.ToUnitConversions);
        }
    }
    
    public class UnitConversionGraphType : ObjectGraphType<UnitConversion> {
        public UnitConversionGraphType() {
            Field(x => x.Id);
            Field(x => x.Ratio);
            Field<UnitGraphType>(nameof(UnitConversion.FromUnit)).Resolve(x => x.Source.FromUnit);
            Field<UnitGraphType>(nameof(UnitConversion.ToUnit)).Resolve(x => x.Source.ToUnit);
        }       
    }
}
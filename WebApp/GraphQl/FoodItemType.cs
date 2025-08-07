using GraphQL.Types;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class FoodItemType : ObjectGraphType<FoodItem> {
        public FoodItemType() {
            Field(x => x.Id);
            Field(x => x.Name);
            Field(x => x.Brand);
            Field<ListGraphType<ServingSizeType>>(nameof(FoodItem.ServingSizes)).Resolve(context => context.Source.ServingSizes);
        }
    }
    
    public class ServingSizeType : ObjectGraphType<ServingSize> {
        public ServingSizeType() {
            Field(x => x.Id);
            Field(x => x.Quantity);
            Field(x => x.DisplayOrder);
            Field<UnitType>(nameof(ServingSize.Unit)).Resolve(context => context.Source.Unit);
        }
    }
}
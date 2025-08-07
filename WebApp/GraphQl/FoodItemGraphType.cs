using GraphQL.Types;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class FoodItemGraphType : ObjectGraphType<FoodItem> {
        public FoodItemGraphType() {
            Field(x => x.Id);
            Field(x => x.Name);
            Field(x => x.Brand);
            Field<ListGraphType<ServingSizeGraphType>>(nameof(FoodItem.ServingSizes)).Resolve(context => context.Source.ServingSizes);
            Field<ListGraphType<FoodItemNutrientGraphType>>(nameof(FoodItem.FoodItemNutrients)).Resolve(context => context.Source.FoodItemNutrients);
        }
    }
    
    public class ServingSizeGraphType : ObjectGraphType<ServingSize> {
        public ServingSizeGraphType() {
            Field(x => x.Id);
            Field(x => x.Quantity);
            Field(x => x.DisplayOrder);
            Field<UnitGraphType>(nameof(ServingSize.Unit)).Resolve(context => context.Source.Unit);
        }
    }
    
    public class FoodItemNutrientGraphType : ObjectGraphType<FoodItemNutrient> {
        public FoodItemNutrientGraphType() {
            Field(x => x.Id);
            Field<FoodItemGraphType>(nameof(FoodItemNutrient.FoodItem)).Resolve(context => context.Source.FoodItem);
            Field<NutrientGraphType>(nameof(FoodItemNutrient.Nutrient)).Resolve(context => context.Source.Nutrient);
            Field<UnitGraphType>(nameof(FoodItemNutrient.Unit)).Resolve(context => context.Source.Unit);
            Field(x => x.Quantity);
            Field(x => x.DisplayOrder);
        }
    }
}
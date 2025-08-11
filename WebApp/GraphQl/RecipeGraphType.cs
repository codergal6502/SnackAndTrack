using GraphQL.Types;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class RecipeGraphType : ObjectGraphType<Recipe> {
        public RecipeGraphType() {
            Field(x => x.Id);
            Field(x => x.Name);
            Field(x => x.Notes);
            Field(x => x.Source, nullable: true);
            Field<ListGraphType<RecipeIngredientGraphType>>(nameof(Recipe.RecipeIngredients)).Resolve(context => context.Source.RecipeIngredients);
            Field<ListGraphType<AmountMadeGraphType>>(nameof(Recipe.AmountsMade)).Resolve(context => context.Source.AmountsMade);
        }
    }

    public class RecipeIngredientGraphType : ObjectGraphType<RecipeIngredient> {
        public RecipeIngredientGraphType() {
            Field(x => x.Id);
            Field<UnitGraphType>(nameof(RecipeIngredient.Unit)).Resolve(context => context.Source.Unit);
            Field<FoodItemGraphType>(nameof(RecipeIngredient.FoodItem)).Resolve(context => context.Source.FoodItem);
            Field(x => x.Quantity);
            Field(x => x.DisplayOrder);
        }
    }

    public class AmountMadeGraphType : ObjectGraphType<AmountMade> {
        public AmountMadeGraphType() {
            Field(x => x.Id);
            Field<UnitGraphType>(nameof(AmountMade.Unit)).Resolve(context => context.Source.Unit);
            Field(x => x.Quantity);
            Field(x => x.DisplayOrder);
        }
    }
}
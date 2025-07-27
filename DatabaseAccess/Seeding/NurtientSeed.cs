using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.DatabaseAccess.Seeding {
    public class NutrientSeed {
        private readonly SnackAndTrackDbContext _ctx;

        public NutrientSeed(SnackAndTrackDbContext ctx) {
            this._ctx = ctx;
        }

        public void DoSeed() {
            this._ctx.Nutrients.Load();
            this._ctx.Units.Load();

            Int16 displayOrder;

            displayOrder = 0;
            EnsureNutrient("Energy",              "Calories",   "Energy", displayOrder += 10);

            displayOrder = 1000;
            
            EnsureNutrient("Total Fat",           "Grams",      "Macronutrients", displayOrder += 10);
            EnsureNutrient("Saturated Fat",       "Grams",      "Macronutrients", displayOrder += 10);
            EnsureNutrient("Trans Fat",           "Grams",      "Macronutrients", displayOrder += 10);
            EnsureNutrient("Cholesterol",         "Milligrams", "Macronutrients", displayOrder += 10);
            EnsureNutrient("Sodium",              "Milligrams", "Macronutrients", displayOrder += 10);
            EnsureNutrient("Total Carbohydrates", "Grams",      "Macronutrients", displayOrder += 10);
            EnsureNutrient("Dietary Fiber",       "Grams",      "Macronutrients", displayOrder += 10);
            EnsureNutrient("Total Sugars",        "Grams",      "Macronutrients", displayOrder += 10);
            EnsureNutrient("Added Sugars",        "Grams",      "Macronutrients", displayOrder += 10);
            EnsureNutrient("Protein",             "Grams",      "Macronutrients", displayOrder += 10);

            displayOrder = 2000;

            EnsureNutrient("Vitamin D",           "Micrograms", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Calcium",             "Milligrams", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Iron",                "Milligrams", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Potassium",           "Milligrams", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Vitamin A",           "Micrograms", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Vitamin C",           "Milligrams", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Folate",              "Micrograms", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Magnesium",           "Milligrams", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Zinc",                "Milligrams", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Selenium",            "Micrograms", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Copper",              "Milligrams", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Manganese",           "Milligrams", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Choline",             "Milligrams", "Micronutrients", displayOrder += 10);
            EnsureNutrient("Omega-3 Fatty Acids", "Grams",      "Micronutrients", displayOrder += 10);
            EnsureNutrient("Omega-6 Fatty Acids", "Grams",      "Micronutrients", displayOrder += 10);
            EnsureNutrient("Iodine",              "Micrograms", "Micronutrients", displayOrder += 10);

            this._ctx.SaveChanges();
        }

        private void EnsureNutrient(string name, String defaultUnit, String group, Int16 displayOrder)
        {
            if (! this._ctx.Nutrients.Any(u => u.Name == name)) {
                Unit unit = this._ctx.Units.Single(u => u.Name == defaultUnit);
                Nutrient entity = new() { Id = Guid.NewGuid(), Name = name, DefaultUnit = unit, DisplayOrder = displayOrder, Group = group, FoodItemNutrients = [] };
                this._ctx.Nutrients.Add(entity);
            }
        }
    }
}
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

            // See https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels.

            Int16 displayOrder;

            displayOrder = 0;
            EnsureNutrient("Energy",              "Calories",   null,          "Energy", displayOrder += 10);

            displayOrder = 1000;
            
            EnsureNutrient("Total Fat",           "Grams",      null,          "Macronutrients", displayOrder += 10);
            EnsureNutrient("Saturated Fat",       "Grams",      (Single) 20,   "Macronutrients", displayOrder += 10);
            EnsureNutrient("Trans Fat",           "Grams",      null,          "Macronutrients", displayOrder += 10);
            EnsureNutrient("Polyunsaturated Fat", "Grams",      null,          "Macronutrients", displayOrder += 10);
            EnsureNutrient("Monounsaturated Fat", "Grams",      null,          "Macronutrients", displayOrder += 10);
            EnsureNutrient("Cholesterol",         "Milligrams", (Single) 300,  "Macronutrients", displayOrder += 10);
            EnsureNutrient("Sodium",              "Milligrams", (Single) 2300, "Macronutrients", displayOrder += 10);
            EnsureNutrient("Total Carbohydrates", "Grams",      (Single) 275,  "Macronutrients", displayOrder += 10);
            EnsureNutrient("Dietary Fiber",       "Grams",      (Single) 28,   "Macronutrients", displayOrder += 10);
            EnsureNutrient("Total Sugars",        "Grams",      null,          "Macronutrients", displayOrder += 10);
            EnsureNutrient("Added Sugars",        "Grams",      (Single) 50,   "Macronutrients", displayOrder += 10);
            EnsureNutrient("Protein",             "Grams",      (Single) 50,   "Macronutrients", displayOrder += 10);

            displayOrder = 2000;

            EnsureNutrient("Calcium",                      "Milligrams", (Single) 1300, "Micronutrients", displayOrder += 10);
            EnsureNutrient("Iron",                         "Milligrams", (Single) 18,   "Micronutrients", displayOrder += 10);
            EnsureNutrient("Potassium",                    "Milligrams", (Single) 4700, "Micronutrients", displayOrder += 10);
            EnsureNutrient("Vitamin D",                    "Micrograms", (Single) 20,   "Micronutrients", displayOrder += 10);
            EnsureNutrient("Vitamin A (RAE)",              "Micrograms", (Single) 900,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Vitamin C",                    "Milligrams", (Single) 90,   "Micronutrients", displayOrder += 10);
            EnsureNutrient("Vitamin E (alpha-tocopherol)", "Milligrams", (Single) 15,   "Micronutrients", displayOrder += 10);
            EnsureNutrient("Vitamin K",                    "Micrograms", (Single) 120,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Thiamin",                      "Milligrams", (Single) 1.2,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Riboflavin",                   "Milligrams", (Single) 1.3,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Niacin (NE)",                  "Milligrams", (Single) 16,   "Micronutrients", displayOrder += 10);
            EnsureNutrient("Vitamin B6",                   "Milligrams", (Single) 1.7,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Folic Acid",                   "Micrograms", null,          "Micronutrients", displayOrder += 10);
            EnsureNutrient("Vitamin B12",                  "Micrograms", (Single) 2.4,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Pantothenic Acid",             "Milligrams", (Single) 5,    "Micronutrients", displayOrder += 10);
            EnsureNutrient("Choline",                      "Milligrams", (Single) 550,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Magnesium",                    "Milligrams", (Single) 420,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Phosphorus",                   "Milligrams", (Single) 1250, "Micronutrients", displayOrder += 10);
            EnsureNutrient("Zinc",                         "Milligrams", (Single) 11,   "Micronutrients", displayOrder += 10);
            EnsureNutrient("Copper",                       "Milligrams", (Single) 0.9,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Manganese",                    "Milligrams", (Single) 2.3,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Selenium",                     "Micrograms", (Single) 55,   "Micronutrients", displayOrder += 10);
            EnsureNutrient("Chromium",                     "Micrograms", (Single) 35,   "Micronutrients", displayOrder += 10);
            EnsureNutrient("Molybdenum",                   "Micrograms", (Single) 45,   "Micronutrients", displayOrder += 10);
            EnsureNutrient("Omega-3 Fatty Acids",          "Grams",      null,          "Micronutrients", displayOrder += 10);
            EnsureNutrient("Omega-6 Fatty Acids",          "Grams",      null,          "Micronutrients", displayOrder += 10);
            EnsureNutrient("Folate DFE",                   "Micrograms", (Single) 400,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Chloride",                     "Milligrams", (Single) 2300, "Micronutrients", displayOrder += 10);
            EnsureNutrient("Iodine",                       "Micrograms", (Single) 150,  "Micronutrients", displayOrder += 10);
            EnsureNutrient("Bromelain",                    "Milligrams", null,          "Micronutrients", displayOrder += 10);

            this._ctx.SaveChanges();
        }

        private void EnsureNutrient(string name, String defaultUnit, Single? currentDailyValue, String group, Int16 displayOrder)
        {
            Nutrient? nutrient = this._ctx.Nutrients.SingleOrDefault(u => u.Name == name);
            Unit unit = this._ctx.Units.Single(u => u.Name == defaultUnit);
            if (null == nutrient ) {
                Nutrient entity = new() { Id = Guid.NewGuid(), Name = name, DefaultUnit = unit, CurrentDailyValue = currentDailyValue, DisplayOrder = displayOrder, Group = group, FoodItemNutrients = [] };
                this._ctx.Nutrients.Add(entity);
            }
            else {
                nutrient.DefaultUnit = unit;
                nutrient.CurrentDailyValue = currentDailyValue;
                nutrient.DisplayOrder = displayOrder;
                nutrient.Group = group;
            }
        }
    }
}
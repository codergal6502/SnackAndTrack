using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess.Entities;

namespace SnackAndTrack.DatabaseAccess.Seeding {
    public class UnitSeed {
        private readonly SnackAndTrackDbContext _ctx;

        public UnitSeed(SnackAndTrackDbContext ctx) {
            this._ctx = ctx;
        }

        public void DoSeed() {
            this._ctx.Units.Load();

            EnsureUnit("Energy", "Calories",   "cal,kcal", false);
            EnsureUnit("Energy", "Kilojoules", "Kj",       false);

            EnsureUnit("Volume", "Liters",       "L",                  true);
            EnsureUnit("Volume", "Milliliters",  "mL,ml",              true);
            EnsureUnit("Volume", "Gallons",      "gal",                true);
            EnsureUnit("Volume", "Quarts",       "qt",                 true);
            EnsureUnit("Volume", "Cups",         "cup",                true);
            EnsureUnit("Volume", "Tablespoons",  "Tbsp,T",             true);
            EnsureUnit("Volume", "Teaspoons",    "tsp,t",              true);
            EnsureUnit("Volume", "Fluid Ounces", "floz,fl oz,fl. oz.", true);
            
            EnsureUnit("Mass", "Grams",      "g"     , true);
            EnsureUnit("Mass", "Milligrams", "mg"    , true);
            EnsureUnit("Mass", "Micrograms", "µg,mcg", true);
            EnsureUnit("Mass", "Ounces",     "oz"    , true);
            EnsureUnit("Mass", "Pounds",     "lb,lbs", true);

            EnsureUnit("Count", "Items", "", true);

            this._ctx.UnitConversions.Include(uc => uc.FromUnit).Include(uc => uc.ToUnit).Load();

            this._ctx.SaveChanges();

            EnsureUnitConversion("Energy", "Calories", "Kilojoules", (Single) 4.184);

            EnsureUnitConversion("Volume", "Liters",       "Milliliters",  (Single) 1000);
            EnsureUnitConversion("Volume", "Liters",       "Gallons",      (Single) 0.2642);
            EnsureUnitConversion("Volume", "Liters",       "Quarts",       (Single) 1.0567);
            EnsureUnitConversion("Volume", "Liters",       "Cups",         (Single) 4.2268); // This is quite close to the conversion for 1C = 240mL: 236.585596669!
            EnsureUnitConversion("Volume", "Liters",       "Tablespoons",  (Single) 67.628);
            EnsureUnitConversion("Volume", "Liters",       "Teaspoons",    (Single) 202.8841);
            EnsureUnitConversion("Volume", "Liters",       "Fluid Ounces", (Single) 33.814);
            EnsureUnitConversion("Volume", "Milliliters",  "Gallons",      (Single) 0.2642   / 1000); // this looks a little
            EnsureUnitConversion("Volume", "Milliliters",  "Quarts",       (Single) 1.0567   / 1000); // weird but is the 
            EnsureUnitConversion("Volume", "Milliliters",  "Cups",         (Single) 4.2268   / 1000); // least error-prone
            EnsureUnitConversion("Volume", "Milliliters",  "Tablespoons",  (Single) 67.628   / 1000); // way to add this in
            EnsureUnitConversion("Volume", "Milliliters",  "Teaspoons",    (Single) 202.8841 / 1000); // quickly!
            EnsureUnitConversion("Volume", "Milliliters",  "Fluid Ounces", (Single) 33.814   / 1000);
            EnsureUnitConversion("Volume", "Gallons",      "Quarts",       (Single) 4);
            EnsureUnitConversion("Volume", "Gallons",      "Cups",         (Single) 16);
            EnsureUnitConversion("Volume", "Gallons",      "Tablespoons",  (Single) 256);
            EnsureUnitConversion("Volume", "Gallons",      "Teaspoons",    (Single) 768);
            EnsureUnitConversion("Volume", "Gallons",      "Fluid Ounces", (Single) 128);
            EnsureUnitConversion("Volume", "Quarts",       "Cups",         (Single) 4);
            EnsureUnitConversion("Volume", "Quarts",       "Tablespoons",  (Single) 64);
            EnsureUnitConversion("Volume", "Quarts",       "Teaspoons",    (Single) 192);
            EnsureUnitConversion("Volume", "Quarts",       "Fluid Ounces", (Single) 32);
            EnsureUnitConversion("Volume", "Cups",         "Tablespoons",  (Single) 16);
            EnsureUnitConversion("Volume", "Cups",         "Teaspoons",    (Single) 48);
            EnsureUnitConversion("Volume", "Cups",         "Fluid Ounces", (Single) 8);
            EnsureUnitConversion("Volume", "Fluid Ounces", "Tablespoons",  (Single) 2);
            EnsureUnitConversion("Volume", "Fluid Ounces", "Teaspoons",    (Single) 6);
            EnsureUnitConversion("Volume", "Tablespoons",  "Teaspoons",    (Single) 3);

            EnsureUnitConversion("Mass", "Grams",      "Milligrams", (Single) 1000);
            EnsureUnitConversion("Mass", "Grams",      "Micrograms", (Single) 1000000);
            EnsureUnitConversion("Mass", "Grams",      "Ounces",     (Single) 0.03527396);
            EnsureUnitConversion("Mass", "Grams",      "Pounds",     (Single) 0.002204623);
            EnsureUnitConversion("Mass", "Milligrams", "Micrograms", (Single) 1000);
            EnsureUnitConversion("Mass", "Milligrams", "Ounces",     (Single) 0.00003527396);
            EnsureUnitConversion("Mass", "Milligrams", "Pounds",     (Single) 0.000002204623);
            EnsureUnitConversion("Mass", "Micrograms", "Ounces",     (Single) 0.00000003527396);
            EnsureUnitConversion("Mass", "Micrograms", "Pounds",     (Single) 0.000000002204623);
            EnsureUnitConversion("Mass", "Ounces",     "Pounds",     (Single) 16);

            this._ctx.SaveChanges();
        }

        private void EnsureUnitConversion(string type, string fromName, string toName, Single ratio)
        {
            Unit fromUnit = this._ctx.Units.Single(u => u.Type == type && u.Name == fromName);
            Unit toUnit = this._ctx.Units.Single(u => u.Type == type && u.Name == toName);

            UnitConversion? unitConversionA = this._ctx.UnitConversions.SingleOrDefault(uc => uc.FromUnit.Type == type && uc.FromUnit.Name == fromName && uc.ToUnit.Type == type && uc.ToUnit.Name == toName);
            if (null == unitConversionA) {

                unitConversionA = new UnitConversion {
                    Id = Guid.NewGuid()
                  , FromUnit = fromUnit
                  , ToUnit = toUnit
                  , Ratio = ratio
                };

                this._ctx.Add(unitConversionA);
            }
            else {
                unitConversionA.Ratio = ratio;
            }

            UnitConversion? unitConversionB = this._ctx.UnitConversions.SingleOrDefault(uc => uc.FromUnit.Type == type && uc.FromUnit.Name == toName && uc.ToUnit.Type == type && uc.ToUnit.Name == fromName);
            if (null == unitConversionB) {

                unitConversionB = new UnitConversion {
                    Id = Guid.NewGuid()
                  , FromUnit = toUnit
                  , ToUnit = fromUnit
                  , Ratio = 1 / ratio
                };

                this._ctx.Add(unitConversionB);
            }
            else {
                unitConversionB.Ratio = 1 / ratio;
            }
        }

        private void EnsureUnit(string type, string name, string abbreviationCsv, bool canBeFoodQuantity)
        {
            if (! this._ctx.Units.Any(u => u.Name == name && u.Type == type)) {
                Unit entity = new() { Id = Guid.NewGuid(), Type = type, Name = name, AbbreviationCsv = abbreviationCsv, CanBeFoodQuantity = canBeFoodQuantity, FromUnitConversions = [], ToUnitConversions = [] };
                this._ctx.Units.Add(entity);
            }
        }
    }
}
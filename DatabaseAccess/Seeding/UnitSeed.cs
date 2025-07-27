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

            EnsureUnit("Volume", "Liters",      "L",                  true);
            EnsureUnit("Volume", "Gallons",     "gal",                true);
            EnsureUnit("Volume", "Quarts",      "qt",                 true);
            EnsureUnit("Volume", "Cups",        "cup",                true);
            EnsureUnit("Volume", "Tablespoons", "Tbsp,T",             true);
            EnsureUnit("Volume", "Teaspoons",   "tsp,t",              true);
            EnsureUnit("Volume", "Ounces",      "floz,fl oz,fl. oz.", true);
            
            EnsureUnit("Mass", "Grams",      "g"     , true);
            EnsureUnit("Mass", "Milligrams", "mg"    , true);
            EnsureUnit("Mass", "Micrograms", "µg,mcg", true);
            EnsureUnit("Mass", "Ounces",     "oz"    , true);
            EnsureUnit("Mass", "Pounds",     "lb,lbs", true);

            EnsureUnit("Count", "Items", "", true);

            this._ctx.UnitConversions.Include(uc => uc.FromUnit).Include(uc => uc.ToUnit).Load();

            this._ctx.SaveChanges();

            EnsureUnitConversion("Energy", "Calories", "Kilojoules", 4.184);

            EnsureUnitConversion("Volume", "Liters",      "Gallons",     0.2642);
            EnsureUnitConversion("Volume", "Liters",      "Quarts",      1.0567);
            EnsureUnitConversion("Volume", "Liters",      "Cups",        4.2268);
            EnsureUnitConversion("Volume", "Liters",      "Tablespoons", 67.628);
            EnsureUnitConversion("Volume", "Liters",      "Teaspoons",   202.8841);
            EnsureUnitConversion("Volume", "Liters",      "Ounces",      33.814);
            EnsureUnitConversion("Volume", "Gallons",     "Quarts",      4);
            EnsureUnitConversion("Volume", "Gallons",     "Cups",        16);
            EnsureUnitConversion("Volume", "Gallons",     "Tablespoons", 256);
            EnsureUnitConversion("Volume", "Gallons",     "Teaspoons",   768);
            EnsureUnitConversion("Volume", "Gallons",     "Ounces",      128);
            EnsureUnitConversion("Volume", "Quarts",      "Cups",        4);
            EnsureUnitConversion("Volume", "Quarts",      "Tablespoons", 64);
            EnsureUnitConversion("Volume", "Quarts",      "Teaspoons",   192);
            EnsureUnitConversion("Volume", "Quarts",      "Ounces",      32);
            EnsureUnitConversion("Volume", "Cups",        "Tablespoons", 16);
            EnsureUnitConversion("Volume", "Cups",        "Teaspoons",   48);
            EnsureUnitConversion("Volume", "Cups",        "Ounces",      8);
            EnsureUnitConversion("Volume", "Ounces",      "Tablespoons", 2);
            EnsureUnitConversion("Volume", "Ounces",      "Teaspoons",   6);
            EnsureUnitConversion("Volume", "Tablespoons", "Teaspoons",   3);

            EnsureUnitConversion("Mass", "Grams",      "Milligrams", 1000);
            EnsureUnitConversion("Mass", "Grams",      "Micrograms", 1000000);
            EnsureUnitConversion("Mass", "Grams",      "Ounces",     0.03527396);
            EnsureUnitConversion("Mass", "Grams",      "Pounds",     0.002204623);
            EnsureUnitConversion("Mass", "Milligrams", "Micrograms", 1000);
            EnsureUnitConversion("Mass", "Milligrams", "Ounces",     0.00003527396);
            EnsureUnitConversion("Mass", "Milligrams", "Pounds",     0.000002204623);
            EnsureUnitConversion("Mass", "Micrograms", "Ounces",     0.00000003527396);
            EnsureUnitConversion("Mass", "Micrograms", "Pounds",     0.000000002204623);
            EnsureUnitConversion("Mass", "Ounces",     "Pounds",     16);

            this._ctx.SaveChanges();
        }

        private void EnsureUnitConversion(string type, string fromName, string toName, double ratio)
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

        private void EnsureUnit(string type, string name, string abbreviationCsv, bool canBeServingSize)
        {
            if (! this._ctx.Units.Any(u => u.Name == name && u.Type == type)) {
                Unit entity = new() { Id = Guid.NewGuid(), Type = type, Name = name, AbbreviationCsv = abbreviationCsv, CanBeServingSize = canBeServingSize, FromUnitConversions = [], ToUnitConversions = [] };
                this._ctx.Units.Add(entity);
            }
        }
    }
}
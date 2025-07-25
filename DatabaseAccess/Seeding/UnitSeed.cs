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

            EnsureUnits("Volume", "Liters");
            EnsureUnits("Volume", "Gallons");
            EnsureUnits("Volume", "Quarts");
            EnsureUnits("Volume", "Cups");
            EnsureUnits("Volume", "Tablespoons");
            EnsureUnits("Volume", "Teaspooons");
            EnsureUnits("Volume", "Ounces");
            
            EnsureUnits("Mass", "Grams");
            EnsureUnits("Mass", "Milligrams");
            EnsureUnits("Mass", "Micrograms");
            EnsureUnits("Mass", "Ounces");
            EnsureUnits("Mass", "Pounds");

            this._ctx.UnitConversions.Include(uc => uc.FromUnit).Include(uc => uc.ToUnit).Load();

            this._ctx.SaveChanges();

            EnsureUnitConversion("Volume", "Liters",      "Gallons",     0.2642);
            EnsureUnitConversion("Volume", "Liters",      "Quarts",      1.0567);
            EnsureUnitConversion("Volume", "Liters",      "Cups",        4.2268);
            EnsureUnitConversion("Volume", "Liters",      "Tablespoons", 67.628);
            EnsureUnitConversion("Volume", "Liters",      "Teaspooons",  202.8841);
            EnsureUnitConversion("Volume", "Liters",      "Ounces",      33.814);
            EnsureUnitConversion("Volume", "Gallons",     "Quarts",      4);
            EnsureUnitConversion("Volume", "Gallons",     "Cups",        16);
            EnsureUnitConversion("Volume", "Gallons",     "Tablespoons", 256);
            EnsureUnitConversion("Volume", "Gallons",     "Teaspooons",  768);
            EnsureUnitConversion("Volume", "Gallons",     "Ounces",      128);
            EnsureUnitConversion("Volume", "Quarts",      "Cups",        4);
            EnsureUnitConversion("Volume", "Quarts",      "Tablespoons", 64);
            EnsureUnitConversion("Volume", "Quarts",      "Teaspooons",  192);
            EnsureUnitConversion("Volume", "Quarts",      "Ounces",      32);
            EnsureUnitConversion("Volume", "Cups",        "Tablespoons", 16);
            EnsureUnitConversion("Volume", "Cups",        "Teaspooons",  48);
            EnsureUnitConversion("Volume", "Cups",        "Ounces",      8);
            EnsureUnitConversion("Volume", "Ounces",      "Tablespoons", 2);
            EnsureUnitConversion("Volume", "Ounces",      "Teaspooons",  6);
            EnsureUnitConversion("Volume", "Tablespoons", "Teaspooons",  3);

            this._ctx.SaveChanges();
        }

        private void EnsureUnitConversion(string type, string fromName, string toName, double ratio)
        {
            Unit fromUnit = this._ctx.Units.Single(u => u.UnitType == type && u.UnitName == fromName);
            Unit toUnit = this._ctx.Units.Single(u => u.UnitType == type && u.UnitName == toName);

            UnitConversion? unitConversionA = this._ctx.UnitConversions.SingleOrDefault(uc => uc.FromUnit.UnitType == type && uc.FromUnit.UnitName == fromName && uc.ToUnit.UnitType == type && uc.ToUnit.UnitName == toName);
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

            UnitConversion? unitConversionB = this._ctx.UnitConversions.SingleOrDefault(uc => uc.FromUnit.UnitType == type && uc.FromUnit.UnitName == toName && uc.ToUnit.UnitType == type && uc.ToUnit.UnitName == fromName);
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

        private void EnsureUnits(string type, string name)
        {
            if (! this._ctx.Units.Any(u => u.UnitName == name && u.UnitType == type)) {
                Unit entity = new() { Id = Guid.NewGuid(), UnitType = type, UnitName = name };
                this._ctx.Units.Add(entity);
            }
        }
    }
}
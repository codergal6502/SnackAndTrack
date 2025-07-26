using System.Reflection;
using System.Runtime.Serialization;
using System.Security.Cryptography.Xml;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.DatabaseAccess.Entities;
using SnackAndTrack.WebApp.Models;

namespace SnackAndTrack.WebApp.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class ExportDatabaseController : ControllerBase {
        private readonly SnackAndTrackDbContext _context;

        public ExportDatabaseController(SnackAndTrackDbContext context) {
            this._context = context;
        }

        [HttpGet]
        public String Get() {
            var result = new SerializableDatabase {
                FoodItems = ShallowCopy(this._context.FoodItems)
              , FoodItemNutrients = ShallowCopy(this._context.FoodItemNutrients)
              , Nutrients = ShallowCopy(this._context.Nutrients)
              , Units = ShallowCopy(this._context.Units)
              , UnitConversions = ShallowCopy(this._context.UnitConversions)
              , ServingSizes = ShallowCopy(this._context.ServingSizes)
            };

            var settings = new JsonSerializerSettings();
            settings.NullValueHandling = NullValueHandling.Ignore;

            return JsonConvert.SerializeObject(result, settings);
        }

        [HttpPost]
        public async Task<ActionResult> Post() {

            using var reader = new StreamReader(HttpContext.Request.Body);
            var body = await reader.ReadToEndAsync();

            // See https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/required-properties.
            var options = new JsonSerializerOptions {
                TypeInfoResolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver {
                    Modifiers = {
                        static typeInfo => {
                            if (typeInfo.Kind != System.Text.Json.Serialization.Metadata.JsonTypeInfoKind.Object) {
                                return;
                            }

                            foreach (System.Text.Json.Serialization.Metadata.JsonPropertyInfo propertyInfo in typeInfo.Properties) {
                                // Strip IsRequired constraint from every property.
                                propertyInfo.IsRequired = false;
                            }
                        }
                    }
                }
            };

            var deserialized = System.Text.Json.JsonSerializer.Deserialize<SerializableDatabase>(body, options);

            if (null == deserialized) {
                return this.BadRequest();
            }
            else {
                await PopulateDatabase(deserialized);

                throw new NotImplementedException();
                // return Ok();
            }
        }

        private async Task PopulateDatabase(SerializableDatabase deserialized)
        {
            await PopulateFoodItems(deserialized);
            
        }

        private async Task PopulateFoodItems(SerializableDatabase deserialized)
        {
            foreach(FoodItem foodItem in deserialized.FoodItems) {
                this._context.FoodItems.Add(foodItem);
            }

            await this._context.SaveChangesAsync();
        }

        private T[] ShallowCopy<T>(DbSet<T> teeSet) where T : class
        {
            return teeSet.ToList().Select(tee => ShallowCopy(tee)).ToArray();
        }

        private T ShallowCopy<T>(T tee) where T : class {
            Type classType = typeof(T);
            ConstructorInfo defaultConstructor = classType.GetConstructor([]) ?? throw new ExportDatabaseException($"There is no default constructor for {nameof(T)}.");
            T result = (T) defaultConstructor.Invoke([]);

            foreach (var property in classType.GetProperties()) {
                Type propertyType = property.PropertyType;

                if (typeof(String) == propertyType || propertyType.IsSubclassOf(typeof(System.ValueType))) {
                    MethodInfo? getMethod = property.GetGetMethod();
                    MethodInfo? setMethod = property.GetSetMethod();

                    if (null != getMethod && null != setMethod) {
                        var value = getMethod.Invoke(tee, []);
                        setMethod.Invoke(result, [ value ]);
                    }
                }
            }

            return result;
        }

        public class ExportDatabaseException : Exception
        {
            public ExportDatabaseException() { }

            public ExportDatabaseException(string? message) : base(message) { }

            public ExportDatabaseException(string? message, Exception? innerException) : base(message, innerException) { }
        }

        public class SerializableDatabase {
            public required FoodItem[] FoodItems { get; set; }
            public required FoodItemNutrient[] FoodItemNutrients { get; set; }
            public required Nutrient[] Nutrients { get; set; }
            public required Unit[] Units { get; set; }
            public required UnitConversion[] UnitConversions { get; set; }
            public required ServingSize[] ServingSizes { get; set; }
        }
    }
}
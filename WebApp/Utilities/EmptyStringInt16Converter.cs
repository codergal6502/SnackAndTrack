using System.Text.Json;
using System.Text.Json.Serialization;

namespace SnackAndTrack.WebApp.Utilities {
    public class EmptyStringInt16Converter : EmptyStringScalarConverter<Int16> {
        protected override string ConvertToString(Int16 value, JsonSerializerOptions options) {
            return value.ToString();
        }

        protected override bool TryParse(string input, out Int16 result)
        {
            return Int16.TryParse(input, out result);
        }
    }
}
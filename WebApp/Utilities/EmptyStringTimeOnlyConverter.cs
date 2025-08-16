using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SnackAndTrack.WebApp.Utilities {
    public class EmptyStringTimeOnlyConverter : EmptyStringScalarConverter<TimeOnly> {
        protected override String ConvertToString(TimeOnly value, JsonSerializerOptions options) {
            return value.ToString("o", CultureInfo.InvariantCulture);
        }

        protected override bool TryParse(string input, out TimeOnly result) {
            return TimeOnly.TryParse(input, out result);
        }
    }
}
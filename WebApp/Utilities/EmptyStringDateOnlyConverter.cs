using System.Globalization;
using System.Text.Json;

namespace SnackAndTrack.WebApp.Utilities {

    public class EmptyStringDateOnlyConverter : EmptyStringScalarConverter<DateOnly> {
        protected override String ConvertToString(DateOnly value, JsonSerializerOptions options) {
            return value.ToString("o", CultureInfo.InvariantCulture);
        }

        protected override bool TryParse(string input, out DateOnly result) {
            return DateOnly.TryParse(input, out result);
        }
    }
}
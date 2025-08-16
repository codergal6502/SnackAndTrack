using System.Text.Json;

namespace SnackAndTrack.WebApp.Utilities {
    public class EmptyStringGuidConverter : EmptyStringScalarConverter<Guid> {
        protected override string ConvertToString(Guid value, JsonSerializerOptions options) {
            return value.ToString();
        }

        protected override bool TryParse(string input, out Guid result)
        {
            return Guid.TryParse(input, out result);
        }
    }
}
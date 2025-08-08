using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SnackAndTrack.WebApp.Utilities {

    // Based on https://stackoverflow.com/a/77411561.
    public class EmptyStringDateOnlyConverter : JsonConverter<DateOnly?> {
        public override DateOnly? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) {
            if (reader.TokenType == JsonTokenType.String) {
                var readString = reader.GetString();
                if (String.IsNullOrWhiteSpace(readString)) {
                    return null;
                }
                else {
                    return DateOnly.Parse(readString);
                }
            }
            return DateOnly.FromDateTime(reader.GetDateTime().Date);
        }

        public override void Write(Utf8JsonWriter writer, DateOnly? value, JsonSerializerOptions options) {
            if (null == value) {
                writer.WriteStringValue("");
            }
            else {
                // See https://stackoverflow.com/a/115002.
                writer.WriteStringValue(value.Value.ToString("o", CultureInfo.InvariantCulture));
            }
        }
    }
}
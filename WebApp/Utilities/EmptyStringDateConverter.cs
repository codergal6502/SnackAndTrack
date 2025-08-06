using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SnackAndTrack.WebApp.Utilities {

    // Based on https://stackoverflow.com/a/77411561.
    public class EmptyStringDateConverter : JsonConverter<DateTime?>
    {
        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String && String.IsNullOrWhiteSpace(reader.GetString()))
            {
                return null;
            }
            return reader.GetDateTime();
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (null == value)
            {
                writer.WriteStringValue("");
            }
            else
            {
                // See https://stackoverflow.com/a/115002.
                writer.WriteStringValue(value.Value.ToString("o", CultureInfo.InvariantCulture));
            }
        }
    }
}
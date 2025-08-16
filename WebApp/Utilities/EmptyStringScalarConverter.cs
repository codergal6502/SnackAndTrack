using System.Text.Json;
using System.Text.Json.Serialization;

namespace SnackAndTrack.WebApp.Utilities {
    // Based on https://stackoverflow.com/a/77411561.
    public abstract class EmptyStringScalarConverter<ScalarType> : JsonConverter<ScalarType?> where ScalarType : struct {
        public override bool CanConvert(Type typeToConvert) {
            return typeof(ScalarType) == Nullable.GetUnderlyingType(typeToConvert);
        }

        protected abstract bool TryParse(String input, out ScalarType result);
        
        protected virtual ScalarType ReadFromNonStringTokenType(Utf8JsonReader reader) {
            throw new JsonException($"JSON deserialization of JSON token type '{reader.TokenType}' to type {typeof(ScalarType).Name} failed.");
        }

        public override ScalarType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                var readString = reader.GetString();
                if (String.IsNullOrWhiteSpace(readString))
                {
                    return null;
                }
                else
                {
                    ScalarType result;
                    if (TryParse(readString, out result))
                    {
                        return result;
                    }
                    else
                    {
                        // See https://stackoverflow.com/a/65075550
                        throw new JsonException($"JSON deserialization of {JsonSerializer.Serialize(readString)} to type {typeof(ScalarType).Name} failed.");
                    }
                }
            }
            else {
                return ReadFromNonStringTokenType(reader);   
            }
        }

        protected abstract String ConvertToString(ScalarType value, JsonSerializerOptions options);

        public override void Write(Utf8JsonWriter writer, ScalarType? value, JsonSerializerOptions options) {
            if (null == value) {
                writer.WriteStringValue("");
            }
            else {
                // See https://stackoverflow.com/a/115002.
                writer.WriteStringValue(ConvertToString(value.Value, options));
            }
        }
    }
}
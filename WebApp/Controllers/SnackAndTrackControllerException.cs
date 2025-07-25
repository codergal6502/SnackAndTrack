namespace SnackAndTrack.WebApp.Controllers {
    [Serializable]
    public class SnackAndTrackControllerException : ApplicationException
    {
        public SnackAndTrackControllerException()
        {
        }

        public SnackAndTrackControllerException(string? message) : base(message)
        {
        }

        public SnackAndTrackControllerException(string? message, Exception? innerException) : base(message, innerException)
        {
        }
    }
}
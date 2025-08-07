namespace SnackAndTrack.WebApp.GraphQl {
    public class PaginatedResponse<ItemType>
    {
        public PaginatedResponse() {
            Items = [];
        }

        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public List<ItemType> Items { get; set; }
    }
}
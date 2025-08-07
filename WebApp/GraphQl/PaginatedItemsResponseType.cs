using GraphQL.Types;

namespace SnackAndTrack.WebApp.GraphQl
{
    public class PaginatedItemsResponseType<Entity, ItemType, PaginatedItemsResponse> : ObjectGraphType<PaginatedItemsResponse> where PaginatedItemsResponse : PaginatedResponse<Entity> where ItemType : IGraphType
    {
        public PaginatedItemsResponseType() : this("List of items.") { }

        public PaginatedItemsResponseType(String description)
        {
            Field(x => x.TotalCount);
            Field(x => x.TotalPages);
            Field<ListGraphType<ItemType>>(nameof(PaginatedResponse<Entity>.Items)).Description(description);
        }
    }
}
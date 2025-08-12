import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Select from 'react-select';

const FoodItemList = () => {
    
    const [foodItems, setFoodItems] = useState([]);
    const [nameInput, setNameInput] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchParamObject, setSearchParamObject] = useState();
    const [pageCount, setPageCount] = useState(null);

    useEffect(() => {
        if (searchParamObject) {
            fetchFoodItems();
        }
    }, [searchParamObject]);

    useEffect(() => {
        if (searchParams) {
            var newSearchParamObject = Object.fromEntries(searchParams);
            var defaultSearchParamObject = { name: "", page: 1, pageSize: 20, sortOrder: "ASCENDING", sortBy: "NAME" };
            newSearchParamObject = {...defaultSearchParamObject, ...newSearchParamObject };
            setSearchParamObject(newSearchParamObject);
        }
    }, [searchParams]);

    const sortByOptions = [ { label: "Name", value: "NAME" }, { label: "Brand", value: "BRAND" } ];
    const sortOrderOptions = [ { label: "Ascending", value: "ASCENDING" }, { label: "Descending", value: "DESCENDING" } ];

    const fetchFoodItems = async () => {
        const query = `
query GetFoodItems($page: Int!, $pageSize: Int!, $sortOrder: SortOrder!, $sortBy: FoodItemSortBy!, $name: String) {
  foodItems(
    page: $page
    pageSize: $pageSize
    sortOrder: $sortOrder
    sortBy: $sortBy
    name: $name
  ) {
    totalCount
    totalPages
    items {
      id
      name
      brand
      servingSizes {
        id
        quantity
        displayOrder
        unit {
          id
          abbreviationCsv
          name
          type
        }
      }
    }
  }
}
        `;
        setSearchParams({
            page: parseInt(searchParamObject.page)
          , pageSize: parseInt(searchParamObject.pageSize)
          , sortOrder: searchParamObject.sortOrder
          , sortBy: searchParamObject.sortBy
          , name: searchParamObject.name
        });
        setNameInput(searchParamObject.name);
        const body=JSON.stringify({
            query
          , variables: {
                page: parseInt(searchParamObject.page)
              , pageSize: parseInt(searchParamObject.pageSize)
              , sortOrder: searchParamObject.sortOrder
              , sortBy: searchParamObject.sortBy
              , name: searchParamObject.name
            },
        });
        const response = await fetch('/graphql/query', {
            method: 'POST'
          , headers: {
                'Content-Type': 'application/json'
            }
          , body: body
        });
        
        const { data } = await response.json();
        setPageCount(data.foodItems.totalPages);
        setFoodItems(data.foodItems.items); 
    };

    const searchTextTimeoutIdList = useRef([ ]);

    const debouncedSearchTextChange = async (q) => {
        console.log("fetch", q);
        setSearchParamObject({... searchParamObject, name: q});
    }

    const searchTextChange = async(q) => {
        clearTimeout(searchTextTimeoutIdList.current.shift());
        searchTextTimeoutIdList.current.push(setTimeout((q2) => { debouncedSearchTextChange(q2); }, 100, q));

        setNameInput(q);
    }

    return searchParamObject && (
        <form autoComplete='Off'>
            <h1>Food Items</h1>
            <Link to="/foodItemForm" className="btn btn-primary mb-3">Add Food Item</Link>

            <div className="d-flex mb-3">
                <div className="me-3">
                    <label htmlFor="search" className="form-label">Search:</label>
                    <input
                        id="search"
                        name="search"
                        value={nameInput}
                        className='form-control'
                        onChange={(e) => { searchTextChange(e.target.value); }}
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="page" className="form-label">Page:</label>
                    <Select
                        id="page"
                        name="page"
                        options={[...Array(pageCount).keys().map(i => ({ label: i+1, value: i+1 }))]}
                        value={{ label: searchParamObject.page, value: searchParamObject.page}}
                        onChange={selectedOption => setSearchParamObject({... searchParamObject, page: parseInt(selectedOption.value)})}
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="page-size" className="form-label">Page Size:</label>
                    <Select
                        id="page-size"
                        name="page-size"
                        options={[5, 10, 20, 50, 100].map(i => ({ label: i, value: i }))}
                        value={{ label: searchParamObject.pageSize, value: searchParamObject.pageSize}}
                        onChange={selectedOption => setSearchParamObject({... searchParamObject, pageSize: parseInt(selectedOption.value)})}
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="sort-by" className="form-label">Sort By:</label>
                    <Select
                        id="sort-by"
                        name="sort-by"
                        options={sortByOptions}
                        value={sortByOptions.filter(x => x.value == searchParamObject.sortBy)}
                        onChange={selectedOption => setSearchParamObject({... searchParamObject, sortBy: selectedOption.value})}
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="sort-order" className="form-label">Sort Order:</label>
                    <Select
                        id="sort-order"
                        name="sort-order"
                        options={sortOrderOptions}
                        value={sortOrderOptions.filter(x => x.value == searchParamObject.sortOrder)}
                        onChange={selectedOption => setSearchParamObject({... searchParamObject, sortOrder: selectedOption.value})}
                    />
                </div>
            </div>

            <table className='table table-striped table-bordered'>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Brand</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {foodItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.brand}</td>
                            <td>
                                <div className="btn-group" role="group" aria-label="Basic example">
                                    <Link to={`/fooditemview/${item.id}`} className="btn btn-primary">View</Link>
                                    <Link to={`/fooditemform/${item.id}`} className="btn btn-secondary">Edit</Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
                {/* TODO: Implement this
                <tfoot>
                    <tr>
                        <td colspan="4">
                            {
                                [...Array(pageCount).keys().map(i => <span>{i}</span>)]                                
                            }
                        </td>
                    </tr>
                </tfoot> */}
            </table>
        </form>
    );
};

export default FoodItemList;

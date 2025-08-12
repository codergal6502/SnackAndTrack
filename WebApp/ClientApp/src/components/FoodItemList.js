import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { yesNoOptions, copyWithoutNullValues, objectFromSearchParams } from '../utilties';

const FoodItemList = () => {
    
    const [foodItems, setFoodItems] = useState([]);
    const [nameInput, setNameInput] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchParamObject, setSearchParamObject] = useState();
    const [pageCount, setPageCount] = useState(null);
    const [listedPages, setListedPages] = useState([])

    useEffect(() => {
        if (searchParamObject) {
            fetchFoodItems();
            setSearchParams(copyWithoutNullValues(searchParamObject));
        }
    }, [searchParamObject]);

    useEffect(() => {
        if (searchParams) {
            if (!searchParamObject) {
                var newSearchParamObject = objectFromSearchParams(searchParams);
                
                var defaultSearchParamObject = {
                    name: ""
                  , page: 1
                  , pageSize: 20
                  , useableInRecipe: null
                  , usableInFoodJournal: null
                  , sortOrder: "ASCENDING"
                  , sortBy: "NAME"
                };
    
                newSearchParamObject = {...defaultSearchParamObject, ...newSearchParamObject };
                setSearchParamObject(newSearchParamObject);
                setNameInput(newSearchParamObject.name);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        const endPageCount = 2;
        const maxMiddlePages = 2;
        if (pageCount) {
            // if (pageCount < 2 * endPageCount + maxMiddlePages) {
            //     const newListedPages = Array(pageCount).fill(0).map((_, a) => a + 1);
            //     setListedPages(newListedPages);
            // }
            // else {
            //     const middleStart = pageCount / 2 - maxMiddlePages / 2;
            //     const firstPages = Array(endPageCount).fill(0).map((_, a) => a + 1);
            //     const lastPages = Array(endPageCount).fill(0).map((_, a) => pageCount - endPageCount + a + 1);

            //     let middlePages = Array(maxMiddlePages).fill(0).map((_, a) => middleStart + a + 1);

            //     if (endPageCount < searchParamObject.page && searchParamObject.page <= pageCount - endPageCount) {
            //         if (0 > middlePages.indexOf())
            //     }

            //     setListedPages([...firstPages, ...middlePages, ...lastPages]);
            // }
            setListedPages(Array(pageCount).fill(0).map((_, a) => a + 1));
        }
    }, [pageCount])

    const sortByOptions = [ { label: "Name", value: "NAME" }, { label: "Brand", value: "BRAND" } ];
    const sortOrderOptions = [ { label: "Ascending", value: "ASCENDING" }, { label: "Descending", value: "DESCENDING" } ];

    const fetchFoodItems = async () => {
        const query = `
query GetFoodItems($page: Int!, $pageSize: Int!, $sortOrder: SortOrder!, $sortBy: FoodItemSortBy!, $name: String, $usableInFoodJournal: Boolean, $usableAsRecipeIngredient: Boolean) {
  foodItems(
    page: $page
    pageSize: $pageSize
    sortOrder: $sortOrder
    sortBy: $sortBy
    name: $name
    usableInFoodJournal: $usableInFoodJournal
    usableAsRecipeIngredient: $usableAsRecipeIngredient
  ) {
    totalCount
    totalPages
    items {
      id
      name
      brand
      usableInFoodJournal
      usableAsRecipeIngredient
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
}`;

        const body=JSON.stringify({
            query
          , variables: {
                page: parseInt(searchParamObject.page)
              , pageSize: parseInt(searchParamObject.pageSize)
              , sortBy: searchParamObject.sortBy
              , sortOrder: searchParamObject.sortOrder
              , name: searchParamObject.name
              , usableAsRecipeIngredient: searchParamObject.usableAsRecipeIngredient
              , usableInFoodJournal: searchParamObject.usableInFoodJournal
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
        // This technically isn't debounding since each separate keystroke is a new, intentional press of the button.
        console.log("fetch", q);
        setSearchParamObject({... searchParamObject, name: q});
    }

    const searchTextChange = async(q) => {
        clearTimeout(searchTextTimeoutIdList.current.shift());
        searchTextTimeoutIdList.current.push(setTimeout((q2) => { debouncedSearchTextChange(q2); }, 250, q));

        setNameInput(q);
    }

    return searchParamObject && (
        <form autoComplete='Off'>
            <h1>Food Items</h1>
            <Link to="/foodItemForm" className="btn btn-primary mb-3">Add Food Item</Link>

            <div className="d-flex mb-3">
                <div className="me-3">
                    <label htmlFor="search" className="form-label">Name:</label>
                    <input
                        id="search"
                        name="search"
                        value={nameInput}
                        className='form-control'
                        onChange={(e) => { searchTextChange(e.target.value); }}
                    />
                </div>
                    <div className="me-3">
                    <label htmlFor="usableAsRecipeIngredient" className="form-label">Usable in Recipe:</label>
                    <Select
                        id="usableAsRecipeIngredient"
                        options={yesNoOptions}
                        name="usableAsRecipeIngredient"
                        value={yesNoOptions.filter(opt => opt.value == searchParamObject.usableAsRecipeIngredient)}
                        onChange={selectedOption => { setSearchParamObject({... searchParamObject, usableAsRecipeIngredient: selectedOption?.value}); }}
                        styles={{width: "100%"}}
                        isClearable
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="usableInFoodJournal" className="form-label">Usable in Food Journal:</label>
                    <Select
                        id="usableInFoodJournal"
                        options={yesNoOptions}
                        name="usableInFoodJournal"
                        value={yesNoOptions.filter(opt => opt.value == searchParamObject.usableInFoodJournal)}
                        onChange={selectedOption => { setSearchParamObject({... searchParamObject, usableInFoodJournal: selectedOption?.value}); }}
                        styles={{width: "100%"}}
                        isClearable
                    />
                </div>
                {/* <div className="me-3">
                    <label htmlFor="page" className="form-label">Page:</label>
                    <Select
                        id="page"
                        name="page"
                        options={[...Array(pageCount).keys().map(i => ({ label: i+1, value: i+1 }))]}
                        value={{ label: searchParamObject.page, value: searchParamObject.page}}
                        onChange={selectedOption => setSearchParamObject({... searchParamObject, page: parseInt(selectedOption.value)})}
                    />
                </div> */}
                <div className="me-3">
                    <label htmlFor="page-size" className="form-label">Results per Size:</label>
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
                        <th>Usable in Recipe</th>
                        <th>Usable in Food Journal</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {foodItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.brand}</td>
                            <td>{yesNoOptions.filter(o => o.value == item.usableAsRecipeIngredient)[0]?.label}</td>
                            <td>{yesNoOptions.filter(o => o.value == item.usableInFoodJournal)[0]?.label}</td>
                            <td>
                                <div className="btn-group" role="group" aria-label="Basic example">
                                    <Link to={`/fooditemview/${item.id}`} className="btn btn-primary">View</Link>
                                    <Link to={`/FoodItemForm/${item.id}`} className="btn btn-secondary">Edit</Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
                {(pageCount > 0) && <tfoot>
                    <tr>
                        <td colSpan="4" className="text-center">
                            <div className='btn-group'>
                                {
                                    (listedPages??[]).map(i =>
                                        <button
                                            key={i}
                                            type='button'
                                            // style={1 == pageCount ? { } : i == 1 ? { borderRight: "1px solid black" } : i == pageCount ? { borderLeft: "1px solid black" } : { borderRight: "1px solid black", borderLeft: "1px solid black" } }
                                            className={`btn ${i == searchParamObject.page ? 'btn-outline-info' : 'btn-info'}`}
                                            onClick={() => setSearchParamObject({... searchParamObject, page: i})}
                                        >{i}</button>
                                    )
                                }
                            </div>
                        </td>
                    </tr>
                </tfoot>}
            </table>
        </form>
    );
};

export default FoodItemList;

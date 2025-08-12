import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';

import { fetchGraphQl, copyWithoutNullValues, objectFromSearchParams } from '../utilties';

const RecipeList = () => {

    const [recipes, setRecipes] = useState([]);
    const [nameInput, setNameInput] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchParamObject, setSearchParamObject] = useState();
    const [pageCount, setPageCount] = useState(null);
    const [listedPages, setListedPages] = useState([]);
    const navigate = useNavigate();

    useEffect(() => { document.title = "Snack and Track: Recipe List" }, [])

    useEffect(() => {
        if (searchParamObject) {
            fetchRecipes();
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
        if (pageCount) {
            setListedPages(Array(pageCount).fill(0).map((_, a) => a + 1));
        }
    }, [pageCount])

    const sortByOptions = [ { label: "Name", value: "NAME" } ];
    const sortOrderOptions = [ { label: "Ascending", value: "ASCENDING" }, { label: "Descending", value: "DESCENDING" } ];

    const fetchRecipes = async () => {
        const query = `
query Recipes($name: String, $page: Int!, $pageSize: Int!, $sortOrder: SortOrder!, $sortBy: RecipeSortBy!) {
  recipes(
    name: $name
    page: $page
    pageSize: $pageSize
    sortOrder: $sortOrder
    sortBy: $sortBy
  ) {
    totalCount
    totalPages
    items {
      id
      name
    }
  }
}`;
        const data = await fetchGraphQl(query, {
            page: parseInt(searchParamObject.page)
          , pageSize: parseInt(searchParamObject.pageSize)
          , sortOrder: searchParamObject.sortOrder
          , sortBy: searchParamObject.sortBy
          , name: searchParamObject.name
        });

        setPageCount(data.recipes.totalPages);
        setRecipes(data.recipes.items); 
    };
    
    const searchTextTimeoutIdList = useRef([ ]);

    const debouncedSearchTextChange = async (q) => {
        // This technically isn't debounding since each separate keystroke is a new, intentional press of the button.
        setSearchParamObject({... searchParamObject, name: q});
    }

    const searchTextChange = async(q) => {
        clearTimeout(searchTextTimeoutIdList.current.shift());
        searchTextTimeoutIdList.current.push(setTimeout((q2) => { debouncedSearchTextChange(q2); }, 100, q));

        setNameInput(q);
    }

    return searchParamObject && (
        <form autoComplete='Off'>
            <h1>Recipes</h1>
            <button onClick={() => navigate("/RecipeForm")} className="btn btn-primary mb-3">Add Recipe</button>

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
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {recipes.map((item, index) => (
                        <tr key={index}>
                            <td>{item.name}</td>
                            <td>
                                <div className="bd-example m-0 border-0">
                                    <button
                                        type="button"
                                        className='btn btn-primary'
                                        onClick={() => navigate(`/RecipeForm/${item.id}`)}
                                    >Edit</button>
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

export default RecipeList;

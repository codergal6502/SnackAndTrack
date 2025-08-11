import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';

const RecipeList = () => {
    const [recipes, setRecipes] = useState([]);

    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortOrder, setSortOrder] = useState("ASCENDING");
    const [sortBy, setSortBy] = useState("NAME")

    useEffect(() => {
        fetchRecipes();
    }, []);

    const sortByOptions = [ { label: "Name", value: "NAME" } ];
    const sortOrderOptions = [ { label: "Ascending", value: "ASCENDING" }, { label: "Descending", value: "DESCENDING" } ];

    const fetchRecipes = async () => {
        const query = `
query Recipes($page: Int!, $pageSize: Int!, $sortOrder: SortOrder!, $sortBy: RecipeSortBy!) {
    recipes(page: $page, pageSize: $pageSize, sortOrder: $sortOrder, sortBy: $sortBy) {
        items {
            id
            name
        }
    }
}
        `;

        const body=JSON.stringify({
            query
          , variables: {
                page: parseInt(page)
              , pageSize: parseInt(pageSize)
              , sortOrder
              , sortBy
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
        setPageCount(data.recipes.totalPages);
        setRecipes(data.recipes.items); 
    };

    const handleDelete = async (id) => {
        await fetch(`/api/recipes/${id}`, {
            method: 'DELETE',
        });
        fetchRecipes();
    };

    return (
        <div>
            <h1>Recipes</h1>
            <Link to="/RecipeForm" className="btn btn-primary mb-3">Add Recipe</Link>

            <div className="d-flex mb-3">
                <div className="me-3">
                    <label htmlFor="page" className="form-label">Page:</label>
                    <Select
                        id="page"
                        name="page"
                        options={[...Array(pageCount).keys().map(i => ({ label: i+1, value: i+1 }))]}
                        value={{ label: page, value: page}}
                        onChange={selectedOption => setPage(selectedOption.value)}
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="page-size" className="form-label">Page Size:</label>
                    <Select
                        id="page-size"
                        name="page-size"
                        options={[5, 10, 20, 50, 100].map(i => ({ label: i, value: i }))}
                        value={{ label: pageSize, value: pageSize}}
                        onChange={selectedOption => setPageSize(selectedOption.value)}
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="sort-by" className="form-label">Sort By:</label>
                    <Select
                        id="sort-by"
                        name="sort-by"
                        options={sortByOptions}
                        value={sortByOptions.filter(x => x.value == sortBy)}
                        onChange={selectedOption => setSortBy(selectedOption.value)}
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="sort-order" className="form-label">Sort Order:</label>
                    <Select
                        id="sort-order"
                        name="sort-order"
                        options={sortOrderOptions}
                        value={sortOrderOptions.filter(x => x.value == sortOrder)}
                        onChange={selectedOption => setSortOrder(selectedOption.value)}
                    />
                </div>
                <div className="me-3">
                    <label className="form-label">&nbsp;</label>
                    <button type="button" className='btn btn-info form-control' onClick={fetchRecipes}>refresh</button>
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
                                <div className="btn-group" role="group" aria-label="Button group">
                                    <Link to={`/recipeview/${item.id}`} className="btn btn-outline-secondary">View</Link>
                                    <Link to={`/RecipeForm/${item.id}`} className="btn btn-outline-secondary">Edit</Link>
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
        </div>
    );
};

export default RecipeList;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';

const FoodItemList = () => {
    const [foodItems, setFoodItems] = useState([]);

    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortOrder, setSortOrder] = useState("ASCENDING");
    const [sortBy, setSortBy] = useState("NAME")

    useEffect(() => {
        fetchFoodItems();
    }, []);

    const sortByOptions = [ { label: "Name", value: "NAME" }, { label: "Brand", value: "BRAND" } ];
    const sortOrderOptions = [ { label: "Ascending", value: "ASCENDING" }, { label: "Descending", value: "DESCENDING" } ];

    const fetchFoodItems = async () => {
        const query = `
            query GetFoodItems($page: Int!, $pageSize: Int!, $sortOrder: SortOrder!, $sortBy: FoodItemSortBy!) {
                foodItems(page: $page, pageSize: $pageSize, sortOrder: $sortOrder, sortBy: $sortBy) {
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

        const body=JSON.stringify({
                query,
                variables: {
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    sortOrder,
                    sortBy,
                },
            });
        const response = await fetch('/graphql/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        });
        
        const { data } = await response.json();
        setPageCount(data.foodItems.totalPages);
        setFoodItems(data.foodItems.items); 
    };

    return (
        <div>
            <h1>Food Items</h1>
            <Link to="/fooditemform" className="btn btn-primary mb-3">Add Food Item</Link>

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
                <div class="me-3">
                    <label className="form-label">&nbsp;</label>
                    <button type="button" className='btn btn-info form-control' onClick={fetchFoodItems}>refresh</button>
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
                                <div class="btn-group" role="group" aria-label="Basic example">
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
        </div>
    );
};

export default FoodItemList;

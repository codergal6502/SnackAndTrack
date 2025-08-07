import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';

const NutritionGoalSetList = () => {
    const [nutritionGoalSets, setNutritionGoalSets] = useState([]);

    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortOrder, setSortOrder] = useState("ASCENDING");
    const [sortBy, setSortBy] = useState("NAME")

    useEffect(() => {
        fetchNutritionGoalSets();
    }, []);

    const sortByOptions = [ { label: "Name", value: "NAME" } ];
    const sortOrderOptions = [ { label: "Ascending", value: "ASCENDING" }, { label: "Descending", value: "DESCENDING" } ];

    const fetchNutritionGoalSets = async () => {
        const query = `
            query GetNutritionGoalSets($page: Int!, $pageSize: Int!, $sortOrder: SortOrder!, $sortBy: NutritionGoalSetSortBy!) {
                nutritionGoalSets(page: $page, pageSize: $pageSize, sortOrder: $sortOrder, sortBy: $sortBy) {
                    items {
                        id
                        name
                        nutritionGoalSetDayModes {
                            id
                            dayNumber
                            type
                        }
                        nutritionGoalSetNutrients {
                            id
                            nutritionGoalSetNutrientTargets {
                                minimum
                                maximum
                                start
                                end
                            }
                            nutrient {
                                name
                                defaultUnit {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const body = JSON.stringify({
            query
          , variables: {
                page: parseInt(page)
              , pageSize: parseInt(pageSize)
              , sortOrder
              , sortBy
            }
        });

        const response = await fetch("/graphql/query", {
            method: 'POST'
          , headers: {
                'Content-Type': 'application/json'
            }
          , body: body
        });

        const { data } = await response.json();
        setPageCount(data.nutritionGoalSets.totalPages);
        setNutritionGoalSets(data.nutritionGoalSets.items); 
    }

    return (
        <div>
            <h1>Nutrition Goal Sets</h1>
            <Link to="/nutritionGoalSetForm" className="btn btn-primary mb-3">Add Nutrition Goal Set</Link>


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
                    <button type="button" className='btn btn-info form-control' onClick={fetchNutritionGoalSets}>refresh</button>
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
                    {nutritionGoalSets.map((item, index) => (
                        <tr key={index}>
                            <td>{item.name}</td>
                            <td>
                                <div class="btn-group" role="group" aria-label="Basic example">
                                    <Link to={`/nutritiongoalsetview/${item.id}`} className="btn btn-primary">View</Link>
                                    <Link to={`/nutritiongoalsetform/${item.id}`} className="btn btn-secondary">Edit</Link>
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

export default NutritionGoalSetList;

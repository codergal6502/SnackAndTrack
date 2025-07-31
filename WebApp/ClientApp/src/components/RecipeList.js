import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const RecipeList = () => {
    const [recipes, setRecipes] = useState([]);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        const response = await fetch('/api/recipes');
        const data = await response.json();
        setRecipes(data);
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
            <Link to="/recipeform" className="btn btn-primary mb-3">Add Recipe</Link>
            <table className="table">
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
                                    <Link to={`/recipeform/${item.id}`} className="btn btn-outline-secondary">Edit</Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RecipeList;

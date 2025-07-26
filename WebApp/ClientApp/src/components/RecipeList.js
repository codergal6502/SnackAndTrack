import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const RecipeList = () => {
    const [recipes, setRecipes] = useState([]);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        debugger;
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
                                <Link to={`/recipeform/${item.id}`} className="btn btn-warning">Edit</Link>
                                <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RecipeList;

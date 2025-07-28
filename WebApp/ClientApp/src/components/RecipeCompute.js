import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";

const RecipeCompute = () => {
    const [recipe, setRecipe] = useState({ name: '', source: '', ingredients: [], amountsMade: [] });
    const [nutritionTable, setNutritionTable] = useState([]);
    const [showNutritionTable, setShowNutritionTable] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (! id) {
            navigate('/RecipeList');
            return;
        }

        fetchRecipe(id);
    }, [id]);

    const fetchRecipe = async (id) => {
        const response = await fetch(`api/recipes/${id}`);
        const data = await response.json();
        setRecipe(data);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
    }

    const handleCompute = async (id) => {
        const response = await fetch(`/api/recipes/computeFoodItem/${id}`);
        const data = await response.json();

        setNutritionTable(data);
        setShowNutritionTable(true);
    }

    return (
        <form onSubmit={handleSubmit}>
            <h4>Compute Recipe Nutrition</h4>
            <div className="row me-3">
                <label htmlFor="recipe-name" className="col-sm-1 col-form-label">Name:</label>
                <div className="col-sm-4">
                    <input
                        id="recipe-name"
                        type="text"
                        name="name"
                        className="form-control"
                        value={recipe.name}
                        readOnly
                    />
                </div>
                <label htmlFor="recipe-source" className="col-sm-1 col-form-label">Source:</label>
                <div className="col-sm-4">
                    <input
                        id="recipe-source"
                        type="text"
                        name="source"
                        className="form-control"
                        value={recipe.source}
                        readOnly
                    />
                </div>
            </div>
            <h5>Ingredients</h5>
            <table className='table table-striped table-bordered'>
                <thead>
                    <tr>
                        <th scope='row'>Ingredient</th>
                        {(recipe.ingredients.map((ingredient, index) => (
                            <th key={index} scope="col">{ingredient.foodItemName}</th>
                        )))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope='row'>Quantity</th>
                        {(recipe.ingredients.map((ingredient, index) => (
                            <td key={index} scope="col">{ingredient.quantity} {ingredient.quantityUnitName}</td>
                        )))}
                    </tr>
                </tbody>
            </table>
            <button className='btn btn-primary' onClick={() => handleCompute(id)}>Generate Table</button>
            {showNutritionTable && (
                <>
                    <h5>Nutrition</h5>
                    <table className='table table-striped table-bordered'>
                        <thead>
                            <tr>
                                <th scope='col'>Nutrient</th>
                                {(recipe.ingredients.map((ingredient, index) => (
                                    <th key={index} scope="col">{ingredient.foodItemName}</th>
                                )))}
                                <th scope="col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(nutritionTable.nutrientSummaries.map((nutrientSummary, index) => {
                                return ( 
                                <tr key={index}>
                                    <th scope="row">{nutrientSummary.nutrientName}</th>
                                    {(recipe.ingredients.map((ingredient, index) => {
                                        const [foodItemContribution] = nutrientSummary.foodItemContributions.filter(fic => fic.foodItemId === ingredient.foodItemId);
                                        const rounded = Math.round(foodItemContribution.nutrientQuantity)
                                        return (
                                            <td key={index}>{ typeof(foodItemContribution.nutrientQuantity) != "number" ?  '-' : `${rounded } ${foodItemContribution.nutrientUnitName}` }</td>
                                        );
                                    }))}
                                    <td>{Math.round(nutrientSummary.totalQuantity)}</td>
                                </tr>
                            );}))}
                        </tbody>
                    </table>
                </>
            )}
        </form>
    );
}

export default RecipeCompute;
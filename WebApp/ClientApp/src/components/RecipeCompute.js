import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";

import Select from 'react-select';

const RecipeCompute = () => {
    const [recipe, setRecipe] = useState({ name: '', source: '', ingredients: [], amountsMade: [] });
    const [foodItemSetup, setFoodItemSetup] = useState({ recipeId: '', servingSizeConversions: [] })
    const [nutritionTable, setNutritionTable] = useState([]);
    const [showNutritionTable, setShowNutritionTable] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetchRecipe(id);
        }
    }, [id]);

    const fetchRecipe = async (id) => {
        const response = await fetch(`api/recipes/${id}`);
        const data = await response.json();
        setRecipe(data);
        setFoodItemSetup({ recipeId: data.id, servingSizeConversions: data.amountsMade.map(am => ({ unitId: am.quantityUnitId, quantity: "" }))})
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const response = await fetch('/api/recipes/createFoodItemForRecipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(foodItemSetup),
        });
        if (response.ok) {
            const data = await response.json();

            navigate(`/fooditemform/${data.foodItemId}`);
        }
        else {
            console.error("Could not POST data.");
        }
    }

    const handleCompute = async (id) => {
        const response = await fetch(`/api/recipes/computeFoodItem/${id}`);
        const data = await response.json();

        setNutritionTable(data);
        setShowNutritionTable(true);
    }

    const handleServingSizeChange = (index, e) => {
        const { name, value } = e.target;
        const servingSizes = [...foodItemSetup.servingSizeConversions];
        servingSizes[index] = { ...servingSizes[index], [name]: value };
        setFoodItemSetup({ ...foodItemSetup, servingSizeConversions: servingSizes});
    };

    const handleCalculateOtherRows = (index) => {
        const ratio = foodItemSetup.servingSizeConversions[index].quantity / recipe.amountsMade[index].quantity;
        const newServingSizes = [...foodItemSetup.servingSizeConversions];

        for (let i = 0; i < foodItemSetup.servingSizeConversions.length; i++) {
            if (index === i) continue;
            newServingSizes[i].quantity = ratio * recipe.amountsMade[i].quantity;
        }

        setFoodItemSetup({ ...foodItemSetup, servingSizeConversions: newServingSizes});
    }

    return (
        <form onSubmit={handleSubmit} autoComplete='Off'>
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
            <button type="button" className='btn btn-primary' onClick={() => handleCompute(id)}>Generate Table</button>
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
                            {(nutritionTable.nutrientSummaries.toSorted((n1, n2) => n1.nutrientUnitDisplayOrder - n2.nutrientUnitDisplayOrder).map((nutrientSummary, index) => {
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
                                    <td>{Math.round(nutrientSummary.totalQuantity)} {nutrientSummary.nutrientUnitName}</td>
                                </tr>
                            );}))}
                        </tbody>
                    </table>
                    <h5>Recipe Serving Sizes</h5>
                    <table className='table table-striped table-bordered'>
                        <thead>
                            <tr>
                                <th scope="col">Unit</th>
                                <th scope="col">Recipes Makes</th>
                                <th scope="col">One Serving Is</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recipe.amountsMade.map((amountsMade, index) => (
                                <tr key={index}>
                                    <td><span className='form-control'>{amountsMade.quantityUnitName}</span></td>
                                    <td><span className='form-control'>{amountsMade.quantity}</span></td>
                                    <td>
                                        <label className='visually-hidden' htmlFor={`servingSize-quantity-${index}`}>Quantity ({amountsMade.quantityUnitName}):</label>
                                        <div className="input-group mb-3">
                                            <input
                                                id={`servingSize-quantity-${index}`}
                                                type="number"
                                                name="quantity"
                                                className="form-control"
                                                value={foodItemSetup.servingSizeConversions[index].quantity}
                                                onChange={(e) => handleServingSizeChange(index, e)}
                                                placeholder={amountsMade.quantityUnitName}
                                                required
                                            />
                                            <button className="btn btn-secondary" type="button" onClick={() => handleCalculateOtherRows(index)}>Calculate Other Rows</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <h5>Actions</h5>
                    <div className="row mb-3">
                        <div className="col-auto align-self-end">
                            <button type="submit" className="btn btn-primary">Save</button>
                        </div>
                    </div>
                </>
            )}
        </form>
    );
}

export default RecipeCompute;
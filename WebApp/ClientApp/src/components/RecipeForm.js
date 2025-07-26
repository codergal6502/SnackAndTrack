import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Select from 'react-select';

import UnitSelector from './UnitSelector'

const RecipeForm = () => {
    const [recipe, setRecipe] = useState({ name: '', source: '', ingredients: [] });
    const { id } = useParams();
    const navigate = useNavigate();

    const [foodItemOptions, setFoodItemOptions] = useState([]);

    const fetchFoodItemOptions = async(q) => {
        if (!q) {
            return;
        }

        try {
            const response = await fetch(`/api/fooditems?q=${q}`);
            if (!response.ok) {
                throw new Error("Request to /api/fooditems reponse status is " + response.status + ".");
            }

            const data = await response.json();
            const options = data.map(item => ({
                value: item.id
              , label: item.name
            }));
            setFoodItemOptions(options);
        }
        catch (error) {
            console.error("Request to /api/fooditems failed.", error)
        }
    };

    const handleIngredientChange = (index, e) => {
        const { name, value } = e.target;
        const ingredients = [...recipe.ingredients];
        ingredients[index] = { ...ingredients[index], [name]: value };
        setRecipe({ ...recipe, ingredients: ingredients});
    }

    const handleIngredientLookupInputChange = (input) => {
        fetchFoodItemOptions(input);
    };

    useEffect(() => {
        if (id) {
            fetchRecipe(id);
        }
    }, [id]);

    const fetchRecipe = async (id) => {
        const response = await fetch(`/api/recipes/${id}`);
        const data = await response.json();
        setRecipe(data);
    };

    const addIngredient = async () => {
        setRecipe({ ...recipe, ingredients: [...recipe.ingredients, { foodItemName: "", foodItemId: "", quantityUnitName: "", quantityUnitId: "", quantity: 0 }]})
    };

    const removeIngredient = (index) => {
        const ingredients = recipe.ingredients.filter((_, i) => i !== index);
        setRecipe({ ...recipe, ingredients: ingredients });
    }

    const moveIngredientUp = (index) => {
        if (index > 0) {
            const ingredientsBefore = recipe.ingredients.slice(0, index - 1);
            const ingredientsAfter  = recipe.ingredients.slice(index + 1);
            const ingredients = [...ingredientsBefore, recipe.ingredients[index], recipe.ingredients[index - 1], ...ingredientsAfter];
            setRecipe({ ...recipe, ingredients: ingredients});
        }
    }

    const moveIngredientDown = (index) => {
        if (index < recipe.ingredients.length - 1) {
            const ingredientsBefore = recipe.ingredients.slice(0, index);
            const ingredientsAfter  = recipe.ingredients.slice(index + 2);
            const ingredients = [...ingredientsBefore, recipe.ingredients[index + 1], recipe.ingredients[index], ...ingredientsAfter];
            setRecipe({ ...recipe, ingredients: ingredients});
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRecipe({ ...recipe, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (id) {
            await fetch(`/api/recipes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recipe),
            });
        } else {
            await fetch('/api/recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recipe),
            });
        }
        navigate('/RecipeList');
    };

    return (
        <form onSubmit={handleSubmit}>
            <h4>Food Item</h4>
            <div className="d-flex mb-3">
                <div className="me-3">
                    <label htmlFor="recipe-name" className="form-label">Name:</label>
                    <input
                        id="recipe-name"
                        type="text"
                        name="name"
                        className="form-control"
                        value={recipe?.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="recipe-source" className="form-label">Source:</label>
                    <input
                        id="recipe-source"
                        type="text"
                        name="source"
                        className="form-control"
                        value={recipe?.source}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <h5>Ingredients</h5>

            {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="row mb-3">
                    <div className="col">
                        <label htmlFor={`ingredient-selection-${index}`}>Ingredient:</label>
                        <Select
                            options={foodItemOptions}
                            onInputChange={handleIngredientLookupInputChange}
                            onChange={(selectedOption) => {
                                const updatedIngredients = [...recipe.ingredients];
                                updatedIngredients[index] = {
                                    ...updatedIngredients[index],
                                    foodItemId: selectedOption ? selectedOption.value : '',
                                    foodItemName: selectedOption ? selectedOption.label : ''
                                };
                                setRecipe({ ...recipe, ingredients: updatedIngredients });
                            }}
                            isClearable
                            value={foodItemOptions.find(option => option.value === ingredient.foodItemId) || null} // Set the value prop
                        />
                    </div>
                    <div className="col">
                        <label htmlFor={`ingredient-quantity-${index}`}>Quantity</label>
                        <input
                            id={`ingredient-quantity-${index}`}
                            type="number"
                            name="quantity"
                            className="form-control"
                            value={ingredient.quantity}
                            onChange={(e) => handleIngredientChange(index, e)}
                            placeholder="Quantity"
                            required
                        />
                    </div>
                    <div className="col-auto align-self-end">
                        <div className="btn-group" role="group" aria-label="Button group">
                            <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => moveIngredientUp(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                            <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => moveIngredientDown(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                            <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => removeIngredient(index)}><i className="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" className="btn btn-secondary mb-3" onClick={addIngredient}>Add Ingredient</button>

            <div className="row mb-3">
                <div className="col-auto align-self-end">
                    <button type="submit" className="btn btn-primary">Save</button>
                </div>
                <div className="col-auto align-self-end">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/recipeList')}>Cancel</button>
                </div>
            </div>
        </form>
    );
};

export default RecipeForm;
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getJson } from '../utilities/utilities';

import Select from 'react-select';

import UnitSelector from './UnitSelector'

const RecipeForm = () => {
    const [recipe, setRecipe] = useState({ name: '', source: '', ingredients: [] });
    const { id } = useParams();
    const navigate = useNavigate();

    // These three are arrays-of-arrays, e.g., [ [ ] ]
    const [ingredientFoodItemOptions, setIngredientFoodItemOptions] = useState([]);
    const [ingredientUnitTypeOptions, setIngredientUnitTypeOptions] = useState([]);
    const [ingredientUnitOptions, setIngredientUnitOptions] = useState([]);

    const fetchIngredientFoodItemOptions = async(index, q) => {
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

            var newFoodItemOptions = [...ingredientFoodItemOptions];
            newFoodItemOptions[index] = options;
            setIngredientFoodItemOptions(newFoodItemOptions);
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

    const updateUnitTypesForIngredient = async(index, ingredientId) => {
        const newUnitTypeOptions = ingredientUnitTypeOptions.slice();
        if (ingredientId) {
            let url = `/api/fooditems/${ingredientId}`
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Request to ${url} reponse status is ${response.status}.`);
                }

                const ingredient = await response.json();
                const unitTypeOptions = ingredient.servingSizes.map(s => ({ value: s.unitType, label: s.unitType }));
                newUnitTypeOptions[index] = unitTypeOptions;
            }
            catch (error) {
                console.error(`Request to ${url} failed.`, error)
            }
        }
        else {
            newUnitTypeOptions[index] = [];
        }
        setIngredientUnitTypeOptions(newUnitTypeOptions);
    };

    const handleIngredientUnitTypeChange = async(index, unitTypeOption) => {
        const newUnitOptions = ingredientUnitOptions.slice();

        if (unitTypeOption?.value) {
            let url = `/api/lookup/units/${unitTypeOption.value}`;
            try {
                const units = await getJson(url);
                const unitOptions = units.map(u => ({ value: u.id, label: u.unitName }));
                newUnitOptions[index] = unitOptions;
            }
            catch (error) {
                console.error(`Request to ${url} failed.`, error)
            }
        }
        else {
            newUnitOptions[index] = [];
        }
        setIngredientUnitOptions(newUnitOptions);

        const newIngredients = [...recipe.ingredients];
        newIngredients[index].quantityUnitName = unitTypeOption?.value;

        const newRecipe = { ...recipe, ingredients: newIngredients};
        setRecipe(newRecipe);
    };

    const handleIngredientUnitChange = async(index, unitOption) => {
        const newIngredients = [...recipe.ingredients];
        newIngredients[index].quantityUnitId = unitOption.value;

        const newRecipe = { ...recipe, ingredients: newIngredients};
        setRecipe(newRecipe);
    }

    const handleIngredientLookupInputChange = (index, text) => {
        fetchIngredientFoodItemOptions(index, text);
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
        setRecipe({ ...recipe, ingredients: [...recipe.ingredients, { foodItemName: "", foodItemId: "", quantityUnitName: "", quantityUnitId: "", quantity: 0 }]});
        setIngredientFoodItemOptions([...ingredientFoodItemOptions, []]);
    };

    const removeIngredient = (index) => {
        const ingredients = recipe.ingredients.filter((_, i) => i !== index);
        setRecipe({ ...recipe, ingredients: ingredients });

        const newFoodItemOptions = ingredientFoodItemOptions.filter((_, i) => i !== index);
        setIngredientFoodItemOptions(newFoodItemOptions);
    }

    const moveIngredientUp = (index) => {
        if (index > 0) {
            let ingredients = recipe.ingredients.slice();
            let a = ingredients[index];
            ingredients[index] = ingredients[index - 1];
            ingredients[index - 1] = a;
            setRecipe({ ...recipe, ingredients: ingredients});

            let options = ingredientFoodItemOptions.slice();
            let b = options[index];
            options[index] = options[index - 1];
            options[index - 1] = b;
            setIngredientFoodItemOptions(options);
        }
    }

    const moveIngredientDown = (index) => {
        if (index < recipe.ingredients.length - 1) {
            let ingredients = recipe.ingredients.slice();
            let a = ingredients[index];
            ingredients[index] = ingredients[index + 1];
            ingredients[index + 1] = a;
            setRecipe({ ...recipe, ingredients: ingredients});

            let options = ingredientFoodItemOptions.slice();
            let b = options[index];
            options[index] = options[index + 1];
            options[index + 1] = b;
            setIngredientFoodItemOptions(options);

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
            <h4>Recipe</h4>
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
                            options={ingredientFoodItemOptions[index]}
                            onInputChange={(text) => handleIngredientLookupInputChange(index, text)}
                            onChange={(selectedOption) => {
                                const updatedIngredients = [...recipe.ingredients];
                                updatedIngredients[index] = {
                                    ...updatedIngredients[index],
                                    foodItemId: selectedOption ? selectedOption.value : '',
                                    foodItemName: selectedOption ? selectedOption.label : ''
                                };
                                setRecipe({ ...recipe, ingredients: updatedIngredients });
                                updateUnitTypesForIngredient(index, selectedOption?.value);
                            }}
                            isClearable
                            value={ingredientFoodItemOptions[index]?.find(option => option.value === ingredient.foodItemId) || null} // Set the value prop
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
                    <div className='col'>
                        <label htmlFor={`ingredient-unit-type-${index}`}>Unit Type:</label>
                        <Select
                            id={`ingredient-unit-type-${index}`}
                            options={ingredientUnitTypeOptions[index]}
                            name="quantityUnitName"
                            isClearable={false}
                            isSearchable={false}
                            isDisabled={false}
                            onChange={(selectedOption) => handleIngredientUnitTypeChange(index, selectedOption)}
                        />
                    </div>
                    <div className='col'>
                        <label htmlFor={`ingredient-unit-${index}`}>Unit:</label>
                        <Select
                            id={`ingredient-unit-${index}`}
                            options={ingredientUnitOptions[index]}
                            name="quantityUnitId"
                            isClearable={false}
                            isSearchable={false}
                            isDisabled={false}
                            onChange={(selectedOption) => handleIngredientUnitChange(index, selectedOption)}
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
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getJson } from '../utilities/utilities';

import Select from 'react-select';

const RecipeForm = () => {
    const [recipe, setRecipe] = useState({ name: '', source: '', ingredients: [], amountsMade: [] });
    const { id } = useParams();
    const navigate = useNavigate();

    // These three are arrays-of-arrays, e.g., [ [ ] ]
    const [ingredientFoodItemOptions, setIngredientFoodItemOptions] = useState([]);
    const [ingredientUnitTypeOptions, setIngredientUnitTypeOptions] = useState([]);
    const [ingredientUnitOptions, setIngredientUnitOptions] = useState([]);

    const [amountMadeUnitOptions, setAmountMadeUnitOptions] = useState([]);

    const [unitTypes, setUnitTypes] = useState([]);
    const [units, setUnits] = useState([]);

    const fetchIngredientFoodItemOptions = async(index, q) => {
        const response = await fetch(`/api/fooditems?q=${q}`);
        if (!response.ok) {
            throw new Error("Request to /api/fooditems reponse status is " + response.status + ".");
        }

        const data = await response.json();
        const options = data.map(item => ({
            value: item.id
          , label: item.name
        }));

        return options;
    }

    const fetchAndSetIngredientFoodItemOptions = async(index, q) => {
        if (!q) {
            return;
        }
        
        try {
            const options = await fetchIngredientFoodItemOptions(index, q);

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

    const updateUnitTypesForIngredient = async(index, foodItemId) => {
        // You can't call this three times in a row when the data first loads because
        // ingredientUnitTypeOptions doesn't get updated.
        // Quoth https://stackoverflow.com/a/61951338:
        //     React state updates are asynchronous, i.e. queued up for the next render
        const newUnitTypeOptions = ingredientUnitTypeOptions.slice();
        if (foodItemId) {
            let url = `/api/fooditems/${foodItemId}`
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
            const unitsForType = units.filter(u => u.unitType === unitTypeOption.value);
            const unitOptions = unitsForType.map(u => ({ value: u.id, label: u.unitName }));
            newUnitOptions[index] = unitOptions;
        }
        else {
            newUnitOptions[index] = [];
        }
        setIngredientUnitOptions(newUnitOptions);

        const newIngredients = [...recipe.ingredients];
        newIngredients[index].quantityUnitType = unitTypeOption?.value;

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
        fetchAndSetIngredientFoodItemOptions(index, text);
    };

    useEffect(() => {
        if (id) {
            fetchUnits().then((fetchedUnits) => fetchRecipe(id, fetchedUnits));
        }
    }, [id]);

    const fetchUnits = async () => {
        let url = `/api/lookup/units`
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Request to ${url} reponse status is ${response.status}.`);
            }

            const fetchedUnits = await response.json();
            setUnits(fetchedUnits);

            setUnitTypes(fetchedUnits.map(u => u.unitType).filter((value, index, array) => array.indexOf(value) === index).map(u => ({ value: u, label: u })));

            return fetchedUnits;
        }
        catch (error) {
            console.error(`Request to ${url} failed.`, error)
            setUnits([]);
        }
    }

    const fetchRecipe = async (id, initialUnits) => {
        const response = await fetch(`/api/recipes/${id}`);
        const data = await response.json();

        const initialIngredientFoodItemOptions = data.ingredients.map((i) => [ { value: i.foodItemId, label: i.foodItemName } ]);
        setIngredientFoodItemOptions(initialIngredientFoodItemOptions);

        const initialIngredientUnitTypeOptions = data.ingredients.map((i) => i.quantityUnitTypeOptions.map(uto => ({ value: uto, label: uto })));
        setIngredientUnitTypeOptions(initialIngredientUnitTypeOptions);

        const initialIngredientUnitOptions = data.ingredients.map((i) => initialUnits.filter(u => u.unitType === i.quantityUnitType).map(u => ({ value: u.id, label: u.unitName })) );
        setIngredientUnitOptions(initialIngredientUnitOptions);

        const amountsMadeInitialUnitOptions = data.amountsMade.map((am) => initialUnits.filter(u => u.unitType === am.quantityUnitType).map(u => ({ value: u.id, label: u.unitName })) );
        setAmountMadeUnitOptions(amountsMadeInitialUnitOptions);

        setRecipe(data);
    };

    const handleAmountMadeChange = (index, e) => {
        const { name, value } = e.target;
        const amountsMade = [...recipe.amountsMade];
        amountsMade[index] = { ...amountsMade[index], [name]: value };
        setRecipe({ ...recipe, amountsMade: amountsMade});
    }

    const addAmountMade = async () => {
        setRecipe({ ...recipe, amountsMade: [...recipe.amountsMade, { quantityUnitType: "", quantityUnitId: "", quantity: 0 }]});
        setAmountMadeUnitOptions([...amountMadeUnitOptions, []]);
    };

    const removeAmountMade = (index) => {
        const amountsMade = recipe.amountsMade.filter((_, i) => i !== index);
        setRecipe({ ...recipe, amountsMade: amountsMade });
    }

    const moveAmountMadeUp = (index) => {
        if (index > 0) {
            let amountsMade = recipe.amountsMade.slice();
            let a = amountsMade[index];
            amountsMade[index] = amountsMade[index - 1];
            amountsMade[index - 1] = a;
            setRecipe({ ...recipe, amountsMade: amountsMade});

            let options = amountMadeUnitOptions.slice();
            let b = options[index];
            options[index] = options[index - 1];
            options[index - 1] = b;
            setAmountMadeUnitOptions(options);
        }
    }

    const moveAmountMadeDown = (index) => {
        if (index < recipe.amountsMade.length - 1) {
            let amountsMade = recipe.amountsMade.slice();
            let a = amountsMade[index];
            amountsMade[index] = amountsMade[index + 1];
            amountsMade[index + 1] = a;
            setRecipe({ ...recipe, amountsMade: amountsMade});

            let options = amountMadeUnitOptions.slice();
            let b = options[index];
            options[index] = options[index + 1];
            options[index + 1] = b;
            setAmountMadeUnitOptions(options);

        }
    }

    const handleAmountMadeUnitTypeChange = async(index, unitTypeOption) => {
        const newUnitOptions = amountMadeUnitOptions.slice();

        if (unitTypeOption?.value) {
            const unitsForType = units.filter(u => u.unitType === unitTypeOption.value);
            const unitOptions = unitsForType.map(u => ({ value: u.id, label: u.unitName }));
            newUnitOptions[index] = unitOptions;
        }
        else {
            newUnitOptions[index] = [];
        }
        setAmountMadeUnitOptions(newUnitOptions);

        const newMadeAmounts = [...recipe.amountsMade];
        newMadeAmounts[index].quantityUnitType = unitTypeOption?.value;

        const newRecipe = { ...recipe, amountsMade: newMadeAmounts};
        setRecipe(newRecipe);
    };

    const handleAmountMadeUnitChange = async(index, unitOption) => {
        const newAmountsMade = [...recipe.amountsMade];
        newAmountsMade[index].quantityUnitId = unitOption.value;

        const newRecipe = { ...recipe, amountsMade: newAmountsMade};
        setRecipe(newRecipe);
    }

    const addIngredient = async () => {
        setRecipe({ ...recipe, ingredients: [...recipe.ingredients, { foodItemName: "", foodItemId: "", quantityUnitType: "", quantityUnitId: "", quantity: 0 }]});
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

            <h5>Amount Made</h5>
            {(recipe.amountsMade || []).map((amountMade, index) => (
                <div key={index} className='row mb-3'>
                    <div className="col">
                        <label htmlFor={`amountMade-quantity-${index}`}>Quantity</label>
                        <input
                            id={`amountMade-quantity-${index}`}
                            type="number"
                            name="quantity"
                            className="form-control"
                            value={amountMade.quantity}
                            onChange={(e) => handleAmountMadeChange(index, e)}
                            placeholder="Quantity"
                            required
                        />
                    </div>
                    <div className='col'>
                        <label htmlFor={`amountMade-unit-type-${index}`}>Unit Type:</label>
                        <Select
                            id={`amountMade-unit-type-${index}`}
                            options={unitTypes}
                            name="amountMadeUnitType"
                            isClearable={false}
                            isSearchable={false}
                            isDisabled={false}
                            onChange={(selectedOption) => handleAmountMadeUnitTypeChange(index, selectedOption)}
                            value={unitTypes.find(option => option.value == amountMade.quantityUnitType) || null}
                        />
                    </div>
                    <div className='col'>
                        <label htmlFor={`amountMade-unit-${index}`}>Unit:</label>
                        <Select
                            id={`amountMade-unit-${index}`}
                            options={amountMadeUnitOptions[index]}
                            name="amountMadeUnitId"
                            isClearable={false}
                            isSearchable={false}
                            isDisabled={false}
                            onChange={(selectedOption) => handleAmountMadeUnitChange(index, selectedOption)}
                            value={amountMadeUnitOptions[index]?.find(option => option.value === amountMade.quantityUnitId) || null}
                        />
                    </div>
                    <div className="col-auto align-self-end">
                        <div className="btn-group" role="group" aria-label="Button group">
                            <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => moveAmountMadeUp(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                            <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => moveAmountMadeDown(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                            <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => removeAmountMade(index)}><i className="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" className="btn btn-secondary mb-3" onClick={addAmountMade}>Add Amount Made</button>

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
                            value={ingredientFoodItemOptions[index]?.find(option => option.value === ingredient.foodItemId) || null}
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
                            name="quantityUnitType"
                            isClearable={false}
                            isSearchable={false}
                            isDisabled={false}
                            onChange={(selectedOption) => handleIngredientUnitTypeChange(index, selectedOption)}
                            value={ingredientUnitTypeOptions[index]?.find(option => option.value == ingredient.quantityUnitType) || null}
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
                            value={ingredientUnitOptions[index]?.find(option => option.value === ingredient.quantityUnitId) || null}
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
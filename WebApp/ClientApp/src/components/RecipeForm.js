import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Select from 'react-select';

const RecipeForm = () => {
    const [recipe, setRecipe] = useState({ name: '', source: '', notes: '', ingredients: [], amountsMade: [] });

    const [unitDictionary, setUnitDictionary] = useState();
    const [unitOptions, setUnitOptions] = useState();

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUnits();
    }, []);

    useEffect(() => {
        if (unitDictionary && id) {
            fetchRecipe(id);
        }
    }, [unitDictionary, id]);

    const fetchUnits = async () => {
        const query = `
{
  units
  {
    id
    name
    abbreviationCsv
    type
    canBeFoodQuantity
    fromUnitConversions
    {
      ratio
      toUnit
      {
        id
        name
      }
    }
  }
}`;
        const url = "/graphql/query";

        try {
            const body = JSON.stringify({query});
            
            const response = await fetch(url, {
                method: 'POST'
              , headers: { 'Content-Type': 'application/json' }
              , body: body
            });

            const { data } = await response.json();

            if (!response.ok) {
                throw new Error(`Request to ${url} reponse status is ${response.status}.`);
            }

            const units = data.units;

            const newUnitDct = units.reduce((result, unit) => { result[unit.id] = unit; return result; }, {});
            setUnitDictionary(newUnitDct);

            // TODO: add a custom quantity type so you can specify, e.g., package or cookie or whatever instead of item

            const groupByType = Object.groupBy(units.filter(u => u.canBeFoodQuantity), u => u.type);
            const unitTypes = Object.keys(groupByType).toSorted((t1, t2) => t1.localeCompare(t2))
            const groupedOptions =
                unitTypes
                    .map(unitType => ({
                        label: unitType
                      , options: groupByType[unitType].toSorted((u1, u2) => u1.name.localeCompare(u2.name)).map(unit => ({
                            value: unit.id
                          , label: unit.name
                          , unit: unit
                        }))
                    }));

            setUnitOptions(groupedOptions);
        }
        catch (error) {
            console.error(`Request to ${url} failed.`, error)
            setUnitDictionary(null);
            setUnitOptions(null);
        }
    }

    // These three are arrays-of-arrays, e.g., [ [ ] ]
    const [ingredientFoodItemOptions, setIngredientFoodItemOptions] = useState([]);
    const [ingredientUnitTypeOptions, setIngredientUnitTypeOptions] = useState([]);
    const [ingredientUnitOptions, setIngredientUnitOptions] = useState([]);

    const [amountMadeUnitOptions, setAmountMadeUnitOptions] = useState([]);

    const fetchIngredientFoodItemOptions = async(index, q) => {
        const query = `
query foodItems($query: String) {
  foodItems(query: $query, pageSize: 10) {
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
          canBeFoodQuantity
        }
      }
      foodItemNutrients {
        id
        nutrient {
          id
          name
          currentDailyValue
          group
          displayOrder
        }
        unit {
          id
          abbreviationCsv
          name
          type
          canBeFoodQuantity
        }
      }
    }
  }
}`;

        const body = JSON.stringify({query, variables: { query: q }});
        const response = await fetch('/graphql/query', {
            method: 'POST'
          , headers: {
                'Content-Type': 'application/json'
            }
          , body: body
        });
        
        const { data } = await response.json();

        const options = data.foodItems.items.map(item => ({
            value: item.id
          , label: item.name
          , foodItem: item
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
            const unitsForType = Object.values(unitDictionary).filter(u => u.type === unitTypeOption.value);
            const unitOptions = unitsForType.map(u => ({ value: u.id, label: u.name }));
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

    const handleIngredientSelectionChange = async (index, selectedOption) => {
        if (selectedOption) {
            const unitTypes = selectedOption.foodItem.servingSizes.map(s => s.unit.type);
            const ingredientUnitOptions = unitOptions.filter(grp => unitTypes.indexOf(grp.label) >= 0);
            const newIngredient = { foodItemId: selectedOption.value, quantity: 0, quantityUnitId: null, ingredientUnitOptions: ingredientUnitOptions };
            
            const newIngredients = [... recipe.ingredients];
            newIngredients[index] = newIngredient;

            const newRecipe = {...recipe, ingredients: newIngredients};
            setRecipe(newRecipe);
        }
        else {
            const newIngredient = { foodItemId: null, quantity: 0, quantityUnitId: null, ingredientUnitOptions: ingredientUnitOptions };
            
            const newIngredients = [... recipe.ingredients];
            newIngredients[index] = newIngredient;

            const newRecipe = {...recipe, ingredients: newIngredients};
            setRecipe(newRecipe);
        }
    }

    const fetchRecipe = async (id) => {
        const response = await fetch(`/api/recipes/${id}`);
        const data = await response.json();

        const initialIngredientFoodItemOptions = data.ingredients.map((i) => [ { value: i.foodItemId, label: i.foodItemName } ]);
        setIngredientFoodItemOptions(initialIngredientFoodItemOptions);

        const initialIngredientUnitTypeOptions = data.ingredients.map((i) => i.quantityUnitTypeOptions.map(uto => ({ value: uto, label: uto })));
        setIngredientUnitTypeOptions(initialIngredientUnitTypeOptions);

        const initialIngredientUnitOptions = data.ingredients.map((i) => Object.values(unitDictionary).filter(u => u.type === i.quantityUnitType).map(u => ({ value: u.id, label: u.name })) );
        setIngredientUnitOptions(initialIngredientUnitOptions);

        const amountsMadeInitialUnitOptions = data.amountsMade.map((am) => Object.values(unitDictionary).filter(u => u.type === am.quantityUnitType).map(u => ({ value: u.id, label: u.name })) );
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

    const handleAmountMadeUnitChange = async(index, unitOption) => {
        const newAmountsMade = [...recipe.amountsMade];
        newAmountsMade[index].quantityUnitId = unitOption.value;
        newAmountsMade[index].quantityUnitType = unitOption.unit.type;

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
        <form onSubmit={handleSubmit} autoComplete="Off">
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
            <table className='table table-striped table-bordered'>
                <thead>
                    <tr>
                        <th style={{width:"50%"}} scope="col">Unit</th>
                        <th style={{width:"50%"}} scope="col">Quantity</th>
                        <th style={{width: "1%", whiteSpace: "nowrap"}} scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {(recipe.amountsMade || []).map((amountMade, index) => (
                        <tr key={index}>
                            <td>
                                <label htmlFor={`amountMade-quantity-${index}`} className='visually-hidden'>Quantity</label>
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
                            </td>
                            <td>
                                <label htmlFor={`amountMade-unit-${index}`} className='visually-hidden'>Unit:</label>
                                <Select
                                    id={`amountMade-unit-${index}`}
                                    options={unitOptions.filter(grp => {
                                        const otherTypes = recipe.amountsMade.filter((_, i) => i != index).map(am => am.quantityUnitType);
                                        return otherTypes.indexOf(grp.label) < 0;
                                    })}
                                    name="amountMadeUnitId"
                                    isSearchable
                                    isDisabled={false}
                                    onChange={(selectedOption) => handleAmountMadeUnitChange(index, selectedOption)}
                                    value={unitOptions.reduce((acc, cur) => [...acc, ...cur.options], [ ]).find(option => option.value === amountMade.quantityUnitId) || null}
                                />
                            </td>
                            <td>
                                <div className="btn-group" role="group" aria-label="Button group">
                                    <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => moveAmountMadeUp(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                                    <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => moveAmountMadeDown(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                                    <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => removeAmountMade(index)}><i className="bi bi-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button type="button" className="btn btn-secondary mb-3" onClick={addAmountMade} disabled={ (recipe?.amountsMade?.length ?? 0) >= unitOptions?.length }>Add Amount Made</button>

            <h5>Ingredients</h5>
            <table className='table table-striped table-bordered'>
                <thead>
                    <tr>
                        <th style={{width:"33%"}} scope="col">Ingredient</th>
                        <th style={{width:"33%"}} scope="col">Quantity</th>
                        <th style={{width:"33%"}} scope="col">Unit</th>
                        <th style={{width: "1%", whiteSpace: "nowrap"}} scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {recipe.ingredients.map((ingredient, index) => (
                        <tr key={index}>
                            <td className="col">
                                <label htmlFor={`ingredient-selection-${index}`} className='visually-hidden'>Ingredient:</label>
                                <Select
                                    options={ingredientFoodItemOptions[index]}
                                    onInputChange={(text) => handleIngredientLookupInputChange(index, text)}
                                    onChange={selectedOption => { handleIngredientSelectionChange(index, selectedOption); }}
                                    isClearable
                                    value={ingredientFoodItemOptions[index]?.find(option => option.value === ingredient.foodItemId) || null}
                                />
                            </td>
                            <td className="col">
                                <label htmlFor={`ingredient-quantity-${index}`} className='visually-hidden'>Quantity</label>
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
                            </td>
                            <td className='col'>
                                <label htmlFor={`ingredient-unit-${index}`} className='visually-hidden'>Unit:</label>
                                <Select
                                    id={`ingredient-unit-${index}`}
                                    options={ingredient.ingredientUnitOptions}
                                    name="quantityUnitId"
                                    isClearable
                                    onChange={(selectedOption) => handleIngredientUnitChange(index, selectedOption)}
                                    value={ingredient?.ingredientUnitOptions?.reduce((arr, cur) => [...arr, ...cur.options], [])?.find(option => option.value === ingredient.quantityUnitId) || null}
                                />
                            </td>
                            <td className="col-auto align-self-end">
                                <div className="btn-group" role="group" aria-label="Button group">
                                    <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => moveIngredientUp(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                                    <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => moveIngredientDown(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                                    <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => removeIngredient(index)}><i className="bi bi-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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
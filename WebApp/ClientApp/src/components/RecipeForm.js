import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGraphQl, displayOrderCompareFn, useUnits, ungroupOptions, uniqueFilterFn } from '../utilties';
import Select from 'react-select';

const emptyAmountMade = { quantityUnitId: "", quantity: 0, "-unitOptions": [ ] };
const emptyIngredient = { foodItemId: "", quantityUnitId: "", quantity: 0, "-foodItemOptions": [ ], "-unitOptions": [ ] };
const amountMadeIsEmpty = am => "" == ((am.quantityUnitId || "").toString() + (am.quantity || "").toString()).trim();
const ingredientIsEmpty = i => "" == ((i.foodItemId || "").toString() + (i.quantityUnitId || "").toString() + (i.quantity || "").toString()).trim();

const RecipeForm = () => {
    const [recipe, setRecipe] = useState({ name: '', source: '', notes: '', ingredients: [], amountsMade: [  ] });
    const [unitDictionary, unitOptions] = useUnits();
    const [ready, setReady] = useState();

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (unitDictionary && unitOptions) {
            setReady(true);
        }
    }, [unitDictionary, unitOptions]);

    useEffect(() => {
        if (ready && id) {
            fetchRecipe(id);
        }
    }, [ready, id]);

    const fetchRecipe = async (id) => {
        const query = `
query ($id: Guid!) {
  recipe(id: $id) {
    id
    name
    notes
    source
    amountsMade {
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
    recipeIngredients {
      id
      quantity
      displayOrder
      unit {
        id
        abbreviationCsv
        name
        type
      }
      foodItem {
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
}`;
        const data = await fetchGraphQl(query, { id });
        const recipeEntity = data.recipe;

        const newRecipe = {
            id: recipeEntity.id
          , name: recipeEntity.name
          , notes: recipeEntity.notes
          , source: recipeEntity.source
          , notes: recipeEntity.notes
          , ingredients: (recipeEntity.recipeIngredients ?? []).toSorted(displayOrderCompareFn).map(ri => ({
                foodItemId: ri.foodItem.id
              , quantityUnitId: ri.unit.id
              , quantity: ri.quantity
              , "-foodItemOptions": [ { value: ri.foodItem.id, label: ri.foodItem.name } ]
              , "-unitOptions": unitOptions.filter(opt => opt.label === ri.unit.type)
            }))
          , amountsMade: (recipeEntity.amountsMade ?? []).toSorted(displayOrderCompareFn).map(am => ({
                quantity: am.quantity
              , quantityUnitId: am.unit.id
              , "-unitOptions": unitOptions.filter(opt => opt.label === am.unit.type)
            }))
        };

        setRecipe(newRecipe);
    };

    //#region Amounts Made

    const handleAmountMadeChange = (index, e) => {
        const { name, value } = e.target;
        const amountsMade = [...recipe.amountsMade];
        amountsMade[index] = { ...amountsMade[index], [name]: value };
        const newRecipe = checkEmptiesAndAddAmountMade({ ...recipe, amountsMade: amountsMade});
        validateRecipe(newRecipe);
        setRecipe(newRecipe);
    }

    const handleAddAmountMadeButton = async () => {
        setRecipe({ ...recipe, amountsMade: [...recipe.amountsMade, {...emptyAmountMade}]});
    };

    const handleRemoveAmountMadeButton = (index) => {
        const amountsMade = recipe.amountsMade.filter((_, i) => i !== index);
        setRecipe({ ...recipe, amountsMade: amountsMade });
    }

    const handleMoveAmountMadeUpButton = (index) => {
        if (index > 0) {
            let amountsMade = recipe.amountsMade.slice();
            let a = amountsMade[index];
            amountsMade[index] = amountsMade[index - 1];
            amountsMade[index - 1] = a;
            setRecipe({ ...recipe, amountsMade: amountsMade});
        }
    }

    const handleMoveAmountMadeDownButton = (index) => {
        if (index < recipe.amountsMade.length - 1) {
            let amountsMade = recipe.amountsMade.slice();
            let a = amountsMade[index];
            amountsMade[index] = amountsMade[index + 1];
            amountsMade[index + 1] = a;
            setRecipe({ ...recipe, amountsMade: amountsMade});
        }
    }

    const checkEmptiesAndAddAmountMade = (newRecipe) => {
        // If all of the amount made fields are set for all amounts, add a new one.
        // This facilitates tabbing through.
        const allHaveValues = newRecipe.amountsMade.reduce((acc, cur) => acc && (cur.quantityUnitId && parseFloat(cur.quantity)) ? true : false, true);
        if (allHaveValues && newRecipe.amountsMade.length < unitOptions.length) {
            newRecipe = {...newRecipe, amountsMade: [... newRecipe.amountsMade, {...emptyAmountMade} ]}
        }
        return newRecipe;
    }

    const handleAmountMadeUnitChange = async(index, unitOption) => {
        const newAmountsMade = [...recipe.amountsMade];
        newAmountsMade[index].quantityUnitId = unitOption.value;
        const newRecipe = checkEmptiesAndAddAmountMade({ ...recipe, amountsMade: newAmountsMade});
        validateRecipe(newRecipe);
        setRecipe(newRecipe);
    }

    //#endregion

    //#region Ingredients

    const handleIngredientChange = (index, e) => {
        const { name, value } = e.target;
        const ingredients = [...recipe.ingredients];
        ingredients[index] = { ...ingredients[index], [name]: value };
        const newRecipe = checkEmptiesAndAddIngredient({ ...recipe, ingredients: ingredients});
        validateRecipe(newRecipe);
        setRecipe(newRecipe);
    }

    const handleAddIngredientButton = () => {
        setRecipe({ ...recipe, ingredients: [...recipe.ingredients, emptyIngredient ]});
    };

    const handleRemoveIngredientButton = (index) => {
        const ingredients = recipe.ingredients.filter((_, i) => i !== index);
        setRecipe({ ...recipe, ingredients: ingredients });
    }

    const handleMoveIngredientUpButton = (index) => {
        if (index > 0) {
            let ingredients = recipe.ingredients.slice();
            let a = ingredients[index];
            ingredients[index] = ingredients[index - 1];
            ingredients[index - 1] = a;
            setRecipe({ ...recipe, ingredients: ingredients});
        }
    }

    const handleMoveIngredientDownButton = (index) => {
        if (index < recipe.ingredients.length - 1) {
            let ingredients = recipe.ingredients.slice();
            let a = ingredients[index];
            ingredients[index] = ingredients[index + 1];
            ingredients[index + 1] = a;
            setRecipe({ ...recipe, ingredients: ingredients});
        }
    }

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

        const data = await fetchGraphQl(query, { query: q });

        const options = data.foodItems.items.map(item => ({
            value: item.id
          , label: item.name
          , "-foodItem": item
        }));

        return options;
    }

    const fetchAndSetIngredientFoodItemOptions = async(index, q) => {
        if (!q) {
            return;
        }
        
        try {
            const options = await fetchIngredientFoodItemOptions(index, q);
            const newIngredients = [... recipe.ingredients];
            newIngredients[index]["-foodItemOptions"] = options;
            const newRecipe = {...recipe, ingredients: newIngredients };
            validateRecipe(newRecipe);
            setRecipe(newRecipe);
        }
        catch (error) {
            console.error("Request to /api/fooditems failed.", error)
        }
    };

    const handleIngredientLookupInputChange = (index, text) => {
        fetchAndSetIngredientFoodItemOptions(index, text);
    };

    const handleIngredientSelectionChange = async (index, selectedOption) => {
        if (selectedOption) {
            const unitTypes = selectedOption["-foodItem"].servingSizes.map(s => s.unit.type);
            const ingredientUnitOptions = unitOptions.filter(grp => unitTypes.indexOf(grp.label) >= 0);
            const newIngredient = {
                ...recipe.ingredients[index]
              , foodItemId: selectedOption.value
              , quantityUnitId: null
              , "-unitOptions": ingredientUnitOptions
            };
            
            const newIngredients = [... recipe.ingredients];
            newIngredients[index] = newIngredient;

            const newRecipe = checkEmptiesAndAddIngredient({...recipe, ingredients: newIngredients});
            validateRecipe(newRecipe);
            setRecipe(newRecipe);
        }
        else {
            const newIngredient = {
                foodItemId: null
              , quantity: 0
              , quantityUnitId: null
              , "-unitOptions": []
              , "-foodItemOptions": [ ]
            };
            
            const newIngredients = [... recipe.ingredients];
            newIngredients[index] = newIngredient;

            const newRecipe = {...recipe, ingredients: newIngredients};
            setRecipe(newRecipe);
        }
    }

    const handleIngredientUnitChange = async(index, unitOption) => {
        const newIngredients = [...recipe.ingredients];
        newIngredients[index].quantityUnitId = unitOption.value;

        const newRecipe = checkEmptiesAndAddIngredient({ ...recipe, ingredients: newIngredients});
        validateRecipe(newRecipe);
        setRecipe(newRecipe);
    }

    const checkEmptiesAndAddIngredient = (newRecipe) => {
        // If all of the ingredient fields are set for all ingredients, add a new one.
        // This facilitates tabbing through.
        const allHaveValues = newRecipe.ingredients.reduce((acc, cur) => acc && (cur.foodItemId && cur.quantityUnitId && parseFloat(cur.quantity)) ? true : false, true);
        if (allHaveValues) {
            newRecipe = {...newRecipe, ingredients: [... newRecipe.ingredients, {...emptyIngredient} ]}
        }
        return newRecipe;
    }

    //#endregion

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRecipe({ ...recipe, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hasErrors = validateAndSetRecipe(recipe);

        if (!hasErrors) {

            const recipeToSubmit = {
                ...recipe
              , amountsMade: [... recipe.amountsMade.filter(am => !amountMadeIsEmpty(am))]
              , ingredients: [... recipe.ingredients.filter(i => !ingredientIsEmpty(i))]
            };
            console.log(recipeToSubmit);

            if (id) {
                const response = await fetch(`/api/recipes/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(recipeToSubmit),
                });
                
                setRecipe(recipeToSubmit);
                navigate(`/RecipeForm/${id}`);
            } else {
                const response = await fetch('/api/recipes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(recipeToSubmit),
                });

                const json = await response.json();
                setRecipe({...recipeToSubmit, id: json.id});
                navigate(`/RecipeForm/${json.id}`);
            }
        }
    };


    const validateAndSetRecipe = (recipe) => {
        const newRecipe = { ... recipe, "-show-errors": true };
        validateRecipe(newRecipe);
        
        setRecipe(newRecipe);
        return newRecipe["-has-errors"];
    }

    const validateRecipe = (newRecipe) => {
        let hasErrors = false;

        // the elegant, graceful-looking ||= won't work because of short-circuit evaluation.
        hasErrors = validateRecipeName(newRecipe) || hasErrors;
        hasErrors = validateRecipeAmountsMade(newRecipe) || hasErrors;
        hasErrors = validateIngredients(newRecipe) || hasErrors;

        newRecipe["-has-errors"] = hasErrors;

        return hasErrors;
    };

    const validateRecipeName = (newRecipe) => {
        let hasErrors = false;

        if (! (newRecipe.name || "").trim()) {
            newRecipe["-error-name"] = "Recipe name is required.";
            hasErrors = true;
        }
        else {
            delete newRecipe["-error-name"];
        }

        newRecipe["-has-errors"] = hasErrors;

        return hasErrors;
    };

    const validateRecipeAmountsMade = (newRecipe) => {
        let hasErrors = false;
        const newAmountsMade = [... newRecipe.amountsMade];

        for (const newAmountMade of newAmountsMade) {
            hasErrors = validateAmountMade(newAmountMade) || hasErrors;
        }

        return hasErrors;
    }

    const validateAmountMade = (newAmountMade) => {
        if (amountMadeIsEmpty(newAmountMade)) {
            delete newAmountMade["-error-unitId"];
            delete newAmountMade["-error-quantity"];
            return false;
        }

        let hasErrors = false;

        if (! (newAmountMade.quantityUnitId || "").trim()) {
            newAmountMade["-error-unitId"] = "Amount made unitis required.";
            hasErrors = true;
        }
        else {
            delete newAmountMade["-error-unitId"];
        }

        var quantityFloat = parseFloat(newAmountMade.quantity);

        if (isNaN(quantityFloat)) {
            // Probably impossible.
            newAmountMade["-error-quantity"] = "Amount made quantity must be a number.";
            hasErrors = true;
        }
        else if (0 >= quantityFloat) {
            newAmountMade["-error-quantity"] = "Amount made quantity must be positive.";
            hasErrors = true;
        }
        else {
            delete newAmountMade["-error-quantity"];
        }

        return hasErrors;
    };

    const validateIngredients = (newRecipe) => {
        let hasErrors = false;
        const newIngredients = [... newRecipe.ingredients];

        for (const ingredient of newIngredients) {
            hasErrors = validateIngredient(ingredient) || hasErrors;
        }

        return hasErrors;
    }

    const validateIngredient = (newIngredient) => {
        if (ingredientIsEmpty(newIngredient)) {
            delete newIngredient["-error-foodItemId"];
            delete newIngredient["-error-unitId"];
            delete newIngredient["-error-quantity"];
            return false;
        }

        let hasErrors = false;

        if (! (newIngredient.foodItemId || "").trim()) {
            newIngredient["-error-foodItemId"] = "Ingredient food item is required.";
            hasErrors = true;
        }
        else {
            delete newIngredient["-error-foodItemId"];
        }

        if (! (newIngredient.quantityUnitId || "").trim()) {
            newIngredient["-error-unitId"] = "Ingredient unit is required.";
            hasErrors = true;
        }
        else {
            delete newIngredient["-error-unitId"];
        }

        var quantityFloat = parseFloat(newIngredient.quantity);

        if (isNaN(quantityFloat)) {
            // Probably impossible.
            newIngredient["-error-quantity"] = "Ingredient quantity must be a number.";
            hasErrors = true;
        }
        else if (0 >= quantityFloat) {
            newIngredient["-error-quantity"] = "Ingredient quantity must be positive.";
            hasErrors = true;
        }
        else {
            delete newIngredient["-error-quantity"];
        }

        return hasErrors;
    };

    return (
        <form onSubmit={handleSubmit} autoComplete="Off">
            {(recipe["-show-errors"] && recipe["-has-errors"]) && (<div className='error-message'>Please correct any errors and try saving again.</div>)}

            <h4>Recipe</h4>
            <div className="d-flex mb-3">
                <div className="me-3">
                    <label htmlFor="recipe-name" className="form-label">Name:</label>
                    <input
                        id="recipe-name"
                        type="text"
                        name="name"
                        className={`form-control ${(recipe["-show-errors"] && recipe["-error-name"]) ? "is-invalid" : ""}`}
                        value={recipe?.name}
                        onChange={handleChange}
                    />
                    {(recipe["-show-errors"] && (<div className='error-message'>{recipe["-error-name"]}</div>))}
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

            <div className="mb-3">
                <div className="me-3">
                    <label htmlFor="recipe-notes" className="form-label">Notes:</label>
                    <textarea
                        id="recipe-notes"
                        type="text"
                        name="notes"
                        className="form-control"
                        value={recipe?.notes || ""}
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
                                    className={`form-control ${(recipe["-show-errors"] && amountMade["-error-quantity"]) ? "is-invalid" : ""}`}
                                    value={amountMade.quantity}
                                    onChange={(e) => handleAmountMadeChange(index, e)}
                                    placeholder="Quantity"
                                />
                                {(recipe["-show-errors"] && (<div className='error-message'>{amountMade["-error-quantity"]}</div>))}
                            </td>
                            <td>
                                <label htmlFor={`amountMade-unit-${index}`} className='visually-hidden'>Unit:</label>
                                <Select
                                    id={`amountMade-unit-${index}`}
                                    options={unitOptions.filter(grp => {
                                        const otherTypes = recipe.amountsMade.filter((_, i) => i != index).map(am => { return unitDictionary[am.quantityUnitId]?.type; });
                                        return otherTypes.indexOf(grp.label) < 0;
                                    })}
                                    name="amountMadeUnitId"
                                    isSearchable
                                    isDisabled={false}
                                    onChange={(selectedOption) => handleAmountMadeUnitChange(index, selectedOption)}
                                    value={ungroupOptions(unitOptions).find(option => { 
                                        return option.value === amountMade.quantityUnitId;
                                    }) || null}
                                    classNamePrefix="react-select"
                                    className={`${recipe["-show-errors"] && amountMade["-error-unitId"] ? 'is-invalid' : ''}`}
                                    placeholder="unit"
                                />
                                {(recipe["-show-errors"] && (<div className='error-message'>{amountMade["-error-unitId"]}</div>))}
                            </td>
                            <td>
                                <div className="btn-group" role="group" aria-label="Button group">
                                    <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => handleMoveAmountMadeUpButton(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                                    <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => handleMoveAmountMadeDownButton(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                                    <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => handleRemoveAmountMadeButton(index)}><i className="bi bi-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button type="button" className="btn btn-secondary mb-3" onClick={handleAddAmountMadeButton} disabled={ (recipe?.amountsMade?.length ?? 0) >= unitOptions?.length }>Add Amount Made</button>

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
                                    options={ingredient["-foodItemOptions"]}
                                    onInputChange={(text) => handleIngredientLookupInputChange(index, text)}
                                    onChange={selectedOption => { handleIngredientSelectionChange(index, selectedOption); }}
                                    isClearable
                                    value={ingredient["-foodItemOptions"]?.find(option => option.value === ingredient.foodItemId) || ""}
                                    classNamePrefix="react-select"
                                    className={`${recipe["-show-errors"] && ingredient["-error-foodItemId"] ? 'is-invalid' : ''}`}
                                />
                                {(recipe["-show-errors"] && (<div className='error-message'>{ingredient["-error-foodItemId"]}</div>))}
                            </td>
                            <td className="col">
                                <label htmlFor={`ingredient-quantity-${index}`} className='visually-hidden'>Quantity</label>
                                <input
                                    id={`ingredient-quantity-${index}`}
                                    type="number"
                                    name="quantity"
                                    className={`form-control ${(recipe["-show-errors"] && ingredient["-error-quantity"]) ? "is-invalid" : ""}`}
                                    value={ingredient.quantity}
                                    onChange={(e) => handleIngredientChange(index, e)}
                                    placeholder="Quantity"
                                    required
                                />
                                {(recipe["-show-errors"] && (<div className='error-message'>{ingredient["-error-quantity"]}</div>))}
                            </td>
                            <td className='col'>
                                <label htmlFor={`ingredient-unit-${index}`} className='visually-hidden'>Unit:</label>
                                <Select
                                    id={`ingredient-unit-${index}`}
                                    options={ingredient["-unitOptions"]}
                                    name="quantityUnitId"
                                    onChange={(selectedOption) => handleIngredientUnitChange(index, selectedOption)}
                                    value={ingredient["-unitOptions"]?.reduce((arr, cur) => [...arr, ...cur.options], [])?.find(option => option.value === ingredient.quantityUnitId) || null}
                                    classNamePrefix="react-select"
                                    className={`${recipe["-show-errors"] && ingredient["-error-unitId"] ? 'is-invalid' : ''}`}
                                />
                                {(recipe["-show-errors"] && (<div className='error-message'>{ingredient["-error-unitId"]}</div>))}
                            </td>
                            <td className="col-auto align-self-end">
                                <div className="btn-group" role="group" aria-label="Button group">
                                    <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => handleMoveIngredientUpButton(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                                    <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => handleMoveIngredientDownButton(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                                    <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => handleRemoveIngredientButton(index)}><i className="bi bi-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button type="button" className="btn btn-secondary mb-3" onClick={handleAddIngredientButton}>Add Ingredient</button>

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
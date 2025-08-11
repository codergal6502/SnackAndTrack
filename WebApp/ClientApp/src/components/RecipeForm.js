import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGraphQl, displayOrderCompareFn, useUnits, ungroupOptions, uniqueFilterFn } from '../utilties';
import Select from 'react-select';

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
        if (unitDictionary && id) {
            fetchRecipe(id);
        }
    }, [ready, id]);

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
            setRecipe(newRecipe);
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
            const unitTypes = selectedOption["-foodItem"].servingSizes.map(s => s.unit.type);
            const ingredientUnitOptions = unitOptions.filter(grp => unitTypes.indexOf(grp.label) >= 0);
            const newIngredient = {
                ...recipe.ingredients[index]
              , foodItemId: selectedOption.value
              , quantity: 0
              , quantityUnitId: null
              , "-unitOptions": ingredientUnitOptions
            };
            
            const newIngredients = [... recipe.ingredients];
            newIngredients[index] = newIngredient;

            const newRecipe = {...recipe, ingredients: newIngredients};
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
              , foodItemName: ri.foodItem.name
              , quantityUnitId: ri.unit.id
              , quantityUnitType: ri.unit.type
              , quantityUnitName: ri.unit.name
              , quantity: ri.quantity
              , quantityUnitTypeOptions: ri.foodItem.servingSizes.map(s => s.unit.type).filter(uniqueFilterFn)
              , "-foodItemOptions": [ { value: ri.foodItem.id, label: ri.foodItem.name } ]
              , "-unitOptions": unitOptions.filter(opt => opt.label === ri.unit.type)
            }))
          , amountsMade: (recipeEntity.amountsMade ?? []).toSorted(displayOrderCompareFn).map(am => ({
                quantity: am.quantity
              , quantityUnitId: am.unit.id
              , quantityUnitName: am.unit.name
              , quantityUnitType: am.unit.type
              , "-unitOptions": unitOptions.filter(opt => opt.label === am.unit.type)
            }))
        };

        setRecipe(newRecipe);
    };

    const handleAmountMadeChange = (index, e) => {
        const { name, value } = e.target;
        const amountsMade = [...recipe.amountsMade];
        amountsMade[index] = { ...amountsMade[index], [name]: value };
        setRecipe({ ...recipe, amountsMade: amountsMade});
    }

    const addAmountMade = async () => {
        setRecipe({ ...recipe, amountsMade: [...recipe.amountsMade, { quantityUnitType: "", quantityUnitId: "", quantity: 0, "-unitOptions": [ ]}]});
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
        }
    }

    const moveAmountMadeDown = (index) => {
        if (index < recipe.amountsMade.length - 1) {
            let amountsMade = recipe.amountsMade.slice();
            let a = amountsMade[index];
            amountsMade[index] = amountsMade[index + 1];
            amountsMade[index + 1] = a;
            setRecipe({ ...recipe, amountsMade: amountsMade});
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
        setRecipe({ ...recipe, ingredients: [...recipe.ingredients, { foodItemName: "", foodItemId: "", quantityUnitType: "", quantityUnitId: "", quantity: 0, "-foodItemOptions": [ ], "-unitOptions": [ ] }]});
    };

    const removeIngredient = (index) => {
        const ingredients = recipe.ingredients.filter((_, i) => i !== index);
        setRecipe({ ...recipe, ingredients: ingredients });
    }

    const moveIngredientUp = (index) => {
        if (index > 0) {
            let ingredients = recipe.ingredients.slice();
            let a = ingredients[index];
            ingredients[index] = ingredients[index - 1];
            ingredients[index - 1] = a;
            setRecipe({ ...recipe, ingredients: ingredients});
        }
    }

    const moveIngredientDown = (index) => {
        if (index < recipe.ingredients.length - 1) {
            let ingredients = recipe.ingredients.slice();
            let a = ingredients[index];
            ingredients[index] = ingredients[index + 1];
            ingredients[index + 1] = a;
            setRecipe({ ...recipe, ingredients: ingredients});
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRecipe({ ...recipe, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hasErrors = false;// validateAndSetRecipe(recipe);

        if (!hasErrors) {
            if (id) {
                const response = await fetch(`/api/recipes/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(recipe),
                });
                
                navigate(`/RecipeForm/${id}`);
            } else {
                const response = await fetch('/api/recipes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(recipe),
                });

                const json = await response.json();
                setRecipe({...recipe, id: json.id});
                navigate(`/RecipeForm/${json.id}`);
            }
        }
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
                                    options={ingredient["-foodItemOptions"]}
                                    onInputChange={(text) => handleIngredientLookupInputChange(index, text)}
                                    onChange={selectedOption => { handleIngredientSelectionChange(index, selectedOption); }}
                                    isClearable
                                    value={ingredient["-foodItemOptions"]?.find(option => option.value === ingredient.foodItemId) || ""}
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
                                    options={ingredient["-unitOptions"]}
                                    name="quantityUnitId"
                                    isClearable
                                    onChange={(selectedOption) => handleIngredientUnitChange(index, selectedOption)}
                                    value={ingredient["-unitOptions"]?.reduce((arr, cur) => [...arr, ...cur.options], [])?.find(option => option.value === ingredient.quantityUnitId) || null}
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
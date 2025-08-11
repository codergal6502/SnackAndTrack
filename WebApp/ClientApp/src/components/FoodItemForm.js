import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { fetchGraphQl, displayOrderCompareFn, ungroupOptions } from '../utilties';
import Select from 'react-select';

const yesNoOptions = [{ label: "Yes", value: true }, { label: "No", value: false }];
const unitPercent = {
    "id": "",
    "name": "Percent Daily Value",
    "type": "Percent",
    "abbreviationCsv": "%",
}
const unitPercentOption = { label: "Percent", value: "", unit: unitPercent, isPercentUnit: true };

const FoodItemForm = () => {
    const [foodItem, setFoodItem] = useState({ name: '', brand: '', notes: '', generatedFromId: null, generatedFromName: null, servingSizes: [], nutrients: [], "-show-errors": false });

    const [unitDictionary, setUnitDictionary] = useState();
    const [unitOptions, setUnitOptions] = useState();
    const [nutrientOptions, setNutrientOptions] = useState();

    const [ready, setReady] = useState();

    const { id } = useParams();
    const navigate = useNavigate();

    // TODO: after successful save, turn off show errors

    useEffect(() => {
        fetchNutrients();
        fetchUnits();
    }, []);

    useEffect(() => {
        if (unitDictionary && unitOptions && nutrientOptions) {
            setReady(true);
        }
    }, [unitDictionary, unitOptions, nutrientOptions]);

    useEffect(() => {
        if (ready) {
            fetchFoodItem(id);
        }
    }, [ready, id])

    const generateNutrientUnitOptions = (unitId, showPercent) => {
        const possibleUnits = Object.values(unitDictionary).filter(u => u.type == unitDictionary[unitId].type)
    
        let possibleOptions = possibleUnits.map(u => ({ label: u.name, value: u.id, unit: u, isPercentUnit: false }));
        if (showPercent) {
            possibleOptions = [unitPercentOption, ...possibleOptions];
        }

        return possibleOptions;
    };

    const validateAndSetFoodItem = (foodItem) => {
        const newFoodItem = { ... foodItem, "-show-errors": true };
        validateFoodItem(newFoodItem);
        
        setFoodItem(newFoodItem);
        return newFoodItem["-has-errors"];
    }

    const validateFoodItem = (newFoodItem) => {
        let hasErrors = false;

        // the elegant, graceful-looking ||= won't work because of short-circuit evaluation.
        hasErrors = validateFoodItemName(newFoodItem) || hasErrors;
        hasErrors = validateFoodItemServingSizes(newFoodItem) || hasErrors;
        hasErrors = validateFoodItemNutrients(newFoodItem) || hasErrors;

        newFoodItem["-has-errors"] = hasErrors;

        return hasErrors;
    };

    const validateFoodItemName = (foodItem) => {
        let hasErrors = false;

        if (! (foodItem.name || "").trim()) {
            foodItem["-error-name"] = "Food item name is required.";
            hasErrors = true;
        }
        else {
            delete foodItem["-error-name"];
        }

        foodItem["-has-errors"] = hasErrors;

        return hasErrors;
    };

    const validateFoodItemServingSizes = (foodItem) => {
        let hasErrors = false;
        // TODO: why did I do this like this and not pass it directly into the inner function?
        const newServingSizes = [... foodItem.servingSizes];

        for (const servingSize of newServingSizes) {
            hasErrors = validateServingSize(servingSize) || hasErrors;
        }

        return hasErrors;
    }

    const validateServingSize = (servingSize) => {
        let hasErrors = false;

        if (! (servingSize.unitId || "").trim()) {
            servingSize["-error-unitId"] = "Serving size unitis required.";
            hasErrors = true;
        }
        else {
            delete servingSize["-error-unitId"];
        }

        var quantityFloat = parseFloat(servingSize.quantity);

        if (isNaN(quantityFloat)) {
            // Probably impossible.
            servingSize["-error-quantity"] = "Serving size quantity must be a number.";
            hasErrors = true;
        }
        else if (0 >= quantityFloat) {
            servingSize["-error-quantity"] = "Serving size quantity must be positive.";
            hasErrors = true;
        }
        else {
            delete servingSize["-error-quantity"];
        }

        return hasErrors;
    };

    const validateFoodItemNutrients = (foodItem) => {
        let hasErrors = false;

        for (const nutrient of foodItem.nutrients) {
            if (! (nutrient.nutrientId || "").trim()) {
                nutrient["-error-nutrientId"] = "Nutrient is required.";
                hasErrors = true;
            }
            else {
                delete nutrient["-error-nutrientId"];
            }
            
            if (! (nutrient.unitId || "").trim() && !nutrient.isPercentUnit) {
                nutrient["-error-unitId"] = "Nutrient unit is required.";
                hasErrors = true;
            }
            else {
                delete nutrient["-error-unitId"];
            }

            if (nutrient.isPercentUnit) {
                var percentFloat = parseFloat(nutrient.percent);
                if (isNaN(percentFloat)) {
                    // Probably impossible.
                    nutrient["-error-quantity"] = "Nutrient daily value percent must be a number.";
                    hasErrors = true;
                }
                else if (0 >= percentFloat) {
                    nutrient["-error-quantity"] = "Nutrient daily value percent must be positive.";
                    hasErrors = true;
                }
                else {
                    delete nutrient["-error-quantity"];
                }
            }
            else {
                var percentFloat = parseFloat(nutrient.quantity);
                if (isNaN(percentFloat)) {
                    // Probably impossible.
                    nutrient["-error-quantity"] = "Nutrient quantity must be a number.";
                    hasErrors = true;
                }
                else if (0 >= percentFloat) {
                    nutrient["-error-quantity"] = "Nutrient quantity must be positive.";
                    hasErrors = true;
                }
                else {
                    delete nutrient["-error-quantity"];
                }
            }
        }

        return hasErrors;
    }

    const fetchNutrients = async() => {
        const query = `
{
  nutrients
  {
    id
    name
    defaultUnit {
      id
      abbreviationCsv
      name
      type
      canBeFoodQuantity
    }
    currentDailyValue
    group
    displayOrder
  }
}`
        try {
            const data = await fetchGraphQl(query)

            const nutrientArray = data.nutrients.toSorted(displayOrderCompareFn);
            const nutrientGroupDictionary = Object.groupBy(nutrientArray, n => n.group);
            const groupedOptions = Object.keys(nutrientGroupDictionary).map(k => ({
                label: k
              , displayOrder: Math.min.apply(null, nutrientGroupDictionary[k].map(nutrient => nutrient.displayOrder))
              , options: nutrientGroupDictionary[k].toSorted((n1, n2) => n1.displayOrder - n2.displayOrder).map(nutrient => ({
                    value: nutrient.id
                  , label: nutrient.name
                  , nutrient: nutrient
                }))
            })).toSorted((n1, n2) => n1.displayOrder - n2.displayOrder);

            setNutrientOptions(groupedOptions);
        }
        catch (error) {
            console.error(error)
            setNutrientOptions([]);
        }
    }

    const fetchUnits = async () => {
        let url = `/api/lookup/units`
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Request to ${url} reponse status is ${response.status}.`);
            }

            const units = await response.json();
            const newUnitDct = units.reduce((result, unit) => { result[unit.id] = unit; return result; }, {});
            setUnitDictionary(newUnitDct);

            const servingSizeUnitDictionary = Object.groupBy(units.filter(u => u.canBeFoodQuantity), u => u.type);
            const unitTypes = Object.keys(servingSizeUnitDictionary).toSorted((t1, t2) => t1.localeCompare(t2))
            const groupedOptions =
                unitTypes
                    .map(unitType => ({
                        label: unitType
                      , options: servingSizeUnitDictionary[unitType].toSorted((u1, u2) => u1.name.localeCompare(u2.name)).map(unit => ({
                            value: unit.id
                          , label: unit.name
                        }))
                    }));

            setUnitOptions(groupedOptions);
        }
        catch (error) {
            console.error(`Request to ${url} failed.`, error)
        }
    }

    const fetchFoodItem = async (id) => {
        // const response = await fetch(`/api/fooditems/${id}`);
        // const data = await response.json();

        const query = `
query ($id: Guid) {
  foodItem(id: $id) {
    id
    name
    brand
    usableAsRecipeIngredient
    usableInFoodJournal
    notes
    generatedFrom {
      id
      name
    }
    foodItemNutrients {
      quantity
      percent
      displayOrder
      nutrient {
        id
        currentDailyValue
      }
      unit {
        id
        type
      }
    }
    servingSizes {
      quantity
      displayOrder
      unit {
        id
        type
      }
    }
  }
}`;
        const body=JSON.stringify({query, variables: { "id": id }});

        const response = await fetch('/graphql/query', {
            method: 'POST'
          , headers: {
                'Content-Type': 'application/json'
            }
          , body: body
        });

        const { data } = await response.json();

        const foodItem = {
            id: data.foodItem.id
          , name: data.foodItem.name
          , brand: data.foodItem.brand
          , usableAsRecipeIngredient: data.foodItem.usableAsRecipeIngredient
          , usableInFoodJournal: data.foodItem.usableInFoodJournal
          , notes: data.foodItem.notes
          , nutrients: (data?.foodItem?.foodItemNutrients?.toSorted((n1, n2) => n2.displayOrder - n2.displayOrder) ?? []).map(fin => ({
                isPercentUnit: parseFloat(fin.percent) ? true : false
              , quantity: parseFloat(fin.percent) ? null : fin.quantity
              , percent: fin.percent
              , nutrientId: fin.nutrient.id
              , unitId: parseFloat(fin.percent) ? null : fin.unit.id
              , unitOptions: generateNutrientUnitOptions(fin.unit.id, fin.nutrient.currentDailyValue)
            }))
          , servingSizes: (data.foodItem?.servingSizes?.toSorted((n1, n2) => n2.displayOrder - n2.displayOrder) ?? []).map(s => ({
                unitId: s.unit.id
              , unitType: s.unit.type
              , quantity: s.quantity
            }))
        };

        setFoodItem(foodItem);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFoodItem = { ...foodItem, [name]: value };
        validateFoodItem(newFoodItem);
        setFoodItem({ ...newFoodItem, [name]: value });
    };

    const handleUsableAsRecipeIngredient = (selectedOption) => {
        const newFoodItem = { ...foodItem, usableAsRecipeIngredient: selectedOption.value };
        validateFoodItem(newFoodItem);
        setFoodItem({ ...newFoodItem });
    }

    const handleUsableInFoodJournalChange = (selectedOption) => {
        const newFoodItem = { ...foodItem, usableInFoodJournal: selectedOption.value };
        validateFoodItem(newFoodItem);
        setFoodItem({ ...newFoodItem });
    }

    const handleServingSizeChange = (index, e) => {
        const { name, value } = e.target;
        const servingSizes = [...foodItem.servingSizes];
        servingSizes[index] = { ...servingSizes[index], [name]: value };
        const newFoodItem = { ...foodItem, servingSizes: servingSizes};

        validateFoodItem(newFoodItem);

        setFoodItem(newFoodItem)
    };

    const handleServingSizeUnitSeelctionChange = (index, selectedOption) => {
        const newServingSizes = [ ...foodItem.servingSizes];
        newServingSizes[index].unitId = selectedOption?.value;
        const newFoodItem = { ...foodItem, servingSizes: newServingSizes };

        validateFoodItem(newFoodItem);

        setFoodItem(newFoodItem);
    };

    const addServingSize = () => {
        setFoodItem({ ...foodItem, servingSizes: [...foodItem.servingSizes, { unitId: "", quantity: 0, unitType: "" }] });
    };

    const removeServingSize = (index) => {
        const servingSizes = foodItem.servingSizes.filter((_, i) => i !== index);
        setFoodItem({ ...foodItem, servingSizes: servingSizes });
    }

    const moveServingSizeUp = (index) => {
        if (index > 0) {
            const servingSizesBefore = foodItem.servingSizes.slice(0, index - 1);
            const servingSizesAfter  = foodItem.servingSizes.slice(index + 1);
            const servingSizes = [...servingSizesBefore, foodItem.servingSizes[index], foodItem.servingSizes[index - 1], ...servingSizesAfter];
            setFoodItem({ ...foodItem, servingSizes: servingSizes});
        }
    }

    const moveServingSizeDown = (index) => {
        if (index < foodItem.servingSizes.length - 1) {
            const servingSizesBefore = foodItem.servingSizes.slice(0, index);
            const servingSizesAfter  = foodItem.servingSizes.slice(index + 2);
            const servingSizes = [...servingSizesBefore, foodItem.servingSizes[index + 1], foodItem.servingSizes[index], ...servingSizesAfter];
            setFoodItem({ ...foodItem, servingSizes: servingSizes});
        }
    }

    const handleNutrientQuantityChange = (index, value) => {
        const nutrients = [...foodItem.nutrients];
        const currentNutrient = nutrients[index];
        if (currentNutrient.isPercentUnit) {
            nutrients[index] = { ...nutrients[index], quantity: null, percent: value };
        }
        else {
            nutrients[index] = { ...nutrients[index], quantity: value, percent: null };
        }
        setFoodItem({ ...foodItem, nutrients: nutrients });
    };

    const handleNutrientSelectionChange = (index, selectedOption) => {
        if (selectedOption) {
            const selectedNutrient = selectedOption.nutrient;
            let possibleUnits = Object.values(unitDictionary).filter(u => u.type == selectedNutrient.defaultUnit.type);

            const newNutrients = [ ...foodItem.nutrients];
            newNutrients[index].nutrientId = selectedOption?.value;
            newNutrients[index].unitId = selectedNutrient.defaultUnit.id;

            newNutrients[index].unitOptions = generateNutrientUnitOptions(selectedNutrient.defaultUnit.id, selectedNutrient.currentDailyValue);

            const newFoodItem = { ...foodItem, nutrients: newNutrients };
            setFoodItem(newFoodItem);
        }
        else {
            const newNutrients = [ ...foodItem.nutrients];
            newNutrients[index].nutrientId = null;
            newNutrients[index].unitId = null;
            const newFoodItem = { ...foodItem, nutrients: newNutrients };
            setFoodItem(newFoodItem);
        }
    };

    const handleNutrientUnitChange = (selectedOption, index) => {
        const newNutrients = [ ...foodItem.nutrients];
        newNutrients[index].unitId = selectedOption?.value;

        newNutrients[index].isPercentUnit = selectedOption.isPercentUnit;
        if (selectedOption.isPercentUnit) {
            newNutrients[index].percent = newNutrients[index].percent ?? newNutrients[index].quantity ?? 0;
            newNutrients[index].quantity = null;
        }
        else {
            newNutrients[index].quantity = newNutrients[index].quantity ?? newNutrients[index].percent ?? 0;
            newNutrients[index].percent = null;
        }

        const newFoodItem = { ...foodItem, nutrients: newNutrients };
        setFoodItem(newFoodItem);
    };

    const addNutrient = () => {
        setFoodItem({ ...foodItem, nutrients: [...foodItem.nutrients, { quantity: 0, percent: null, nutrientId: null, unitId: null }] });
    };

    const removeNutrient = (index) => {
        const nutrients = foodItem.nutrients.filter((_, i) => i !== index);
        setFoodItem({ ...foodItem, nutrients: nutrients });
    };

    const moveNutrientUp = (index) => {
        if (index > 0) {
            const nutrientsBefore = foodItem.nutrients.slice(0, index - 1);
            const nutrientsAfter  = foodItem.nutrients.slice(index + 1);
            const newNutrients = [...nutrientsBefore, foodItem.nutrients[index], foodItem.nutrients[index - 1], ...nutrientsAfter];
            setFoodItem({ ...foodItem, nutrients: newNutrients});
        }
    }

    const moveNutrientDown = (index) => {
        if (index < foodItem.nutrients.length - 1) {
            const nutrientsBefore = foodItem.nutrients.slice(0, index);
            const nutrientsAfter  = foodItem.nutrients.slice(index + 2);
            const nutrients = [...nutrientsBefore, foodItem.nutrients[index + 1], foodItem.nutrients[index], ...nutrientsAfter];
            setFoodItem({ ...foodItem, nutrients: nutrients});
        }
    }

/*

// this might be useful for validation and other form stuff????

const ParentComponent = ({ prop1, prop2, prop3, children }) => {
    return (
        <div>
            {}
            <div>{children}</div>
        </div>
    );
};

*/

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hasErrors = validateAndSetFoodItem(foodItem);

        if (!hasErrors) {
            if (id) {
                const response = await fetch(`/api/fooditems/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(foodItem),
                });
                
                navigate(`/FoodItemForm/${id}`);
            } else {
                const response = await fetch('/api/fooditems', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(foodItem),
                });

                const json = await response.json();
                navigate(`/FoodItemForm/${json.id}`);
            }
        }
    };

    const handleAnchorClick = async (e) => {
        e.preventDefault();
        navigate(e.currentTarget.pathname);
    };

    return ready && (
        <form autoComplete="off" onSubmit={handleSubmit}>
            <h4>Food Item</h4>
            {(foodItem["-show-errors"] && foodItem["-has-errors"]) && (<div className='error-message'>Please correct any errors and try saving again.</div>)}

            <div className="d-flex mb-3">
                <div className="me-3">
                    <label htmlFor="foodItem-name" className="form-label">Name:</label>
                    <input
                        id="foodItem-name"
                        type="text"
                        name="name"
                        className={`form-control ${(foodItem["-show-errors"] && foodItem["-error-name"]) ? "is-invalid" : ""}`}
                        value={foodItem?.name}
                        onChange={handleChange}
                    />
                    {(foodItem["-show-errors"] && (<div className='error-message'>{foodItem["-error-name"]}</div>))}
                </div>
                <div className="me-3">
                    <label htmlFor="foodItem-brand" className="form-label">Brand:</label>
                    <input
                        id="foodItem-brand"
                        type="text"
                        name="brand"
                        className="form-control"
                        value={foodItem?.brand}
                        onChange={handleChange}
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="usableAsRecipeIngredient" className="form-label">Usable in Recipe:</label>
                    <Select
                        id="usableAsRecipeIngredient"
                        options={yesNoOptions}
                        name="usableAsRecipeIngredient"
                        value={yesNoOptions.filter(opt => opt.value == foodItem.usableAsRecipeIngredient)}
                        onChange={selectedOptions => { handleUsableAsRecipeIngredient(selectedOptions) }}
                        styles={{width: "100%"}}
                    />
                </div>
                <div className="me-3">
                    <label htmlFor="useableInRecipe" className="form-label">Usable in Food Journal:</label>
                    <Select
                        id="useableInRecipe"
                        options={yesNoOptions}
                        name="useableInRecipe"
                        value={yesNoOptions.filter(opt => opt.value == foodItem.usableInFoodJournal)}
                        onChange={selectedOptions => { handleUsableInFoodJournalChange(selectedOptions) }}
                        styles={{width: "100%"}}
                    />
                </div>
            </div>

            <div className="mb-3">
                <div className="me-3">
                    <label htmlFor="foodItem-notes" className="form-label">Notes:</label>
                    <textarea
                        id="foodItem-notes"
                        type="text"
                        name="notes"
                        className="form-control"
                        value={foodItem?.notes || ""}
                        onChange={handleChange}
                    />
                </div>
            </div>
            
            <h5>Serving Sizes</h5>
            <table className='table table-striped table-bordered'>
                <thead>
                    <tr>
                        <th style={{width:"33%"}} scope="col">Unit</th>
                        <th style={{width:"33%"}} scope="col">Quantity</th>
                        {!(foodItem.generatedFromId) && (<th style={{width: "1%", whiteSpace: "nowrap"}} scope="col">Actions</th>)}
                    </tr>
                </thead>
                <tbody>
                    {foodItem.servingSizes.map((servingSize, index) => (
                        <tr key={index}>
                            <td style={{width:"33%"}}>
                                <div className="form-group">
                                    {(() => {
                                        const currentId = `servingSize-unit-${index}`;
                                        return (
                                            <div className='col'>
                                                <label htmlFor={currentId} className='visually-hidden'>Unit:</label>
                                                <Select
                                                    id={currentId}
                                                    options={(() => {
                                                        const otherSelections = foodItem.servingSizes.filter((_, idx) => idx != index).map(u => u.unitId).filter(typeId => typeId);
                                                        const otherSelectedTypes = otherSelections.map(unitId => unitDictionary[unitId].type);

                                                        let ret = unitOptions.filter(grp => otherSelectedTypes.indexOf(grp.label) < 0);
                                                        return ret;
                                                    })()}
                                                    isClearable
                                                    onChange={(selectedOption) => handleServingSizeUnitSeelctionChange(index, selectedOption)}
                                                    value={unitOptions.reduce((result, grp) => [...result, ...grp.options], []).find(option => option.value === servingSize.unitId) || null}
                                                    classNamePrefix="react-select"
                                                    className={`${foodItem["-show-errors"] && servingSize["-error-unitId"] ? 'is-invalid' : ''}`}
                                                    placeholder="unit"
                                                />
                                                {(foodItem["-show-errors"] && (<div className='error-message'>{servingSize["-error-unitId"]}</div>))}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </td>
                            <td style={{width:"33%"}}>
                                <div className="form-group">
                                    {(() => {
                                        const currentId = `servingSize-quantity-${index}`;
                                        return (
                                            <div>
                                                <label htmlFor={currentId} className='visually-hidden'>Unit:</label>
                                                <input
                                                    id={currentId}
                                                    type="number"
                                                    name="quantity"
                                                    className={`form-control ${(foodItem["-show-errors"] && servingSize["-error-quantity"]) ? "is-invalid" : ""}`}
                                                    value={servingSize.quantity}
                                                    onChange={(e) => handleServingSizeChange(index, e)}
                                                    placeholder="quantity"
                                                    required
                                                />
                                                {(foodItem["-show-errors"] && (<div className='error-message'>{servingSize["-error-quantity"]}</div>))}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </td>
                            {!(foodItem.generatedFromId) && (
                                <td style={{width: "1%", whiteSpace: "nowrap"}}>
                                    <div className="form-group">
                                        <div className="col-auto align-self-end">
                                            <div className="btn-group" role="group" aria-label="Button group">
                                                <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => moveServingSizeUp(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                                                <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => moveServingSizeDown(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                                                <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => removeServingSize(index)}><i className="bi bi-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {!(foodItem.generatedFromId) && (<button type="button" className="btn btn-secondary mb-3" disabled={foodItem.servingSizes.length >= unitOptions.length} onClick={addServingSize}>Add Serving Size</button>)}


            <h5>Nutrition Information per Serving</h5>
            <table className='table table-striped table-bordered'>
                <thead>
                    <tr>
                        <th style={{width:"25%"}} scope="col">Nutrient</th>
                        <th style={{width:"33%"}} scope="col">Quantity</th>
                        <th style={{width:"33%"}} scope="col">Unit</th>
                        {!(foodItem.generatedFromId) && (<th style={{width: "1%", whiteSpace: "nowrap"}} scope="col">Actions</th>)}
                    </tr>
                </thead>
                <tbody>
                    {foodItem.nutrients.map((nutrient, index) => (
                        <tr key={index}>
                            <td style={{width:"33%"}}>
                                <div className="form-group">
                                    {(() => {
                                        const currentId = `servingSize-unit-type-${index}`;
                                        return (
                                            <div className="col">
                                                <label htmlFor={`foodItem-nutrient-${index}`} className='visually-hidden'>Nutrient</label>
                                                <Select
                                                    id={`foodItem-nutrient-${index}`}
                                                    name="nutrientId"
                                                    options={(() => {
                                                        const otherSelections = foodItem.nutrients.filter((_, idx) => idx != index).map(n => n.nutrientId);

                                                        let ret = nutrientOptions.map(grp => {
                                                            return ({ ... grp, options: grp.options.filter(opt => {
                                                                return otherSelections.indexOf(opt.value) < 0; 
                                                            }) })
                                                        });

                                                        return ret;
                                                    })()}
                                                    onChange={(selectedOption) => handleNutrientSelectionChange(index, selectedOption)}
                                                    isClearable
                                                    value={nutrientOptions.map(grp => grp.options).flat(1).find(option => option.value === nutrient.nutrientId) || null}
                                                    classNamePrefix="react-select"
                                                    className={`${foodItem["-show-errors"] && nutrient["-error-nutrientId"] ? 'is-invalid' : ''}`}
                                                />
                                                {(foodItem["-show-errors"] && (<div className='error-message'>{nutrient["-error-nutrientId"]}</div>))}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </td>
                            <td style={{width:"33%"}}>
                                <div className="form-group">
                                    <div className="col">
                                        <label htmlFor={`foodItem-nutrient-${index}`} className='visually-hidden'>Quantity</label>
                                        <input
                                            id={`foodItem-nutrient-${index}`}
                                            type="number"
                                            name="quantity"
                                            className={`form-control ${(foodItem["-show-errors"] && nutrient["-error-quantity"]) ? "is-invalid" : ""}`}
                                            value={nutrient.percent ?? nutrient.quantity ?? 0}
                                            onChange={(e) => handleNutrientQuantityChange(index, e.target.value)}
                                            placeholder="Quantity"
                                            required
                                        />
                                        {(foodItem["-show-errors"] && (<div className='error-message'>{nutrient["-error-quantity"]}</div>))}
                                    </div>
                                </div>
                            </td>
                            <td style={{width:"33%"}}>
                                <div className="form-group">
                                    {(() => {
                                        const currentId = `nutrient-unit-type-${index}`;
                                        return (
                                            <div className="col">
                                                <label htmlFor={`foodItem-nutrient-${index}`} className='visually-hidden'>Quantity Unit</label>
                                                <Select
                                                    id={`foodItem-nutrient-${index}`}
                                                    name="unitId"
                                                    options={nutrient.unitOptions}
                                                    onChange={(selectedOption) => handleNutrientUnitChange(selectedOption, index)}
                                                    classNamePrefix="react-select"
                                                    className={`${foodItem["-show-errors"] && nutrient["-error-unitId"] ? 'is-invalid' : ''}`}
                                                    value={parseFloat(nutrient.percent) ? unitPercentOption : nutrient?.unitOptions?.find(option => {
                                                        return option?.value === nutrient.unitId}
                                                    ) || null}
                                                />
                                                    {(foodItem["-show-errors"] && (<div className='error-message'>{nutrient["-error-unitId"]}</div>))}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </td>
                            {!(foodItem.generatedFromId) && (
                                <td style={{width: "1%", whiteSpace: "nowrap"}}>
                                    <div className="form-group">
                                        <div className="col-auto align-self-end">
                                            <div className="btn-group" role="group" aria-label="Button group">
                                                <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => moveNutrientUp(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                                                <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => moveNutrientDown(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                                                <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => removeNutrient(index)}><i className="bi bi-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {!(foodItem.generatedFromId) && (
                <>
                    <div className="row mb-3">
                        <div className="col-auto align-self-end">
                            <button type="button" className="btn btn-secondary" disabled={foodItem.nutrients.length >= ungroupOptions(nutrientOptions).length} onClick={addNutrient}>Add Nutrient</button>
                        </div>
                    </div>
                    <h5>Actions</h5>
                    <div className="row mb-3">
                        <div className="col-auto align-self-end">
                            <button type="submit" className="btn btn-primary">Save</button>
                        </div>
                        <div className="col-auto align-self-end">
                            <button type="button" className="btn btn-secondary" onClick={() => navigate('/FoodItemList')}>Cancel</button>
                        </div>
                    </div>
                </>
            )}
        </form>
    );
};

export default FoodItemForm;
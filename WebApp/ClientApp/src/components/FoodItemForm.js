import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { fetchGraphQl, displayOrderCompareFn, ungroupOptions, yesNoOptions } from '../utilties';
import Select from 'react-select';

const unitPercent = {
    "id": "",
    "name": "Percent Daily Value",
    "type": "Percent",
    "abbreviationCsv": "%",
}
const unitPercentOption = { label: "Percent", value: "", unit: unitPercent, isPercentUnit: true };

const emptyServingSize = { unitId: "", quantity: "", unitType: "" };
const emptyNutrient = { quantity: "", percent: null, nutrientId: null, unitId: null };

const servingSizeIsEmpty = s => "" == ((s.unitId || "").toString() + (s.quantity || "").toString()).trim();
const nutrientIsEmpty = n => "" == ((n.nutrientId || "").toString() + (n.quantity || "").toString() + (n.unitId || "").toString()).trim();

const FoodItemForm = () => {
    const [foodItem, setFoodItem] = useState({ name: '', brand: '', notes: '', generatedFromId: null, generatedFromName: null, servingSizes: [ {... emptyServingSize} ], nutrients: [ {... emptyNutrient} ], "-show-errors": false });

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
        if (ready && id) {
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
        hasErrors = validateServingSizes(newFoodItem) || hasErrors;
        hasErrors = validateNutrients(newFoodItem) || hasErrors;

        newFoodItem["-has-errors"] = hasErrors;

        return hasErrors;
    };

    const validateFoodItemName = (newFoodItem) => {
        let hasErrors = false;

        if (! (newFoodItem.name || "").trim()) {
            newFoodItem["-error-name"] = "Food item name is required.";
            hasErrors = true;
        }
        else {
            delete newFoodItem["-error-name"];
        }

        newFoodItem["-has-errors"] = hasErrors;

        return hasErrors;
    };

    const validateServingSizes = (newFoodItem) => {
        let hasErrors = false;
        // TODO: why did I do this like this and not pass it directly into the inner function?
        const newServingSizes = [... newFoodItem.servingSizes];

        for (const servingSize of newServingSizes) {
            hasErrors = validateServingSize(servingSize) || hasErrors;
        }

        return hasErrors;
    }

    const validateServingSize = (newServingSize) => {
        if (servingSizeIsEmpty(newServingSize)) {
            delete newServingSize["-error-unitId"];
            delete newServingSize["-error-quantity"];
            return false;
        }

        let hasErrors = false;

        if (! (newServingSize.unitId || "").trim()) {
            newServingSize["-error-unitId"] = "Serving size unitis required.";
            hasErrors = true;
        }
        else {
            delete newServingSize["-error-unitId"];
        }

        var quantityFloat = parseFloat(newServingSize.quantity);

        if (isNaN(quantityFloat)) {
            // Probably impossible.
            newServingSize["-error-quantity"] = "Serving size quantity must be a number.";
            hasErrors = true;
        }
        else if (0 >= quantityFloat) {
            newServingSize["-error-quantity"] = "Serving size quantity must be positive.";
            hasErrors = true;
        }
        else {
            delete newServingSize["-error-quantity"];
        }

        return hasErrors;
    };

    const validateNutrients = (newFoodItem) => {
        let hasErrors = false;

        for (const nutrient of newFoodItem.nutrients) {
            hasErrors = validateNutrient(nutrient) || hasErrors;
        }

        return hasErrors;
    }

    const validateNutrient = (newNutrient) => {
        if (nutrientIsEmpty(newNutrient)) {
            delete newNutrient["-error-nutrientId"];
            delete newNutrient["-error-unitId"];
            delete newNutrient["-error-quantity"];
            return false;
        }

        let hasErrors = false;

        if (! (newNutrient.nutrientId || "").trim()) {
            newNutrient["-error-nutrientId"] = "Nutrient is required.";
            hasErrors = true;
        }
        else {
            delete newNutrient["-error-nutrientId"];
        }
        
        if (! (newNutrient.unitId || "").trim() && !newNutrient.isPercentUnit) {
            newNutrient["-error-unitId"] = "Nutrient unit is required.";
            hasErrors = true;
        }
        else {
            delete newNutrient["-error-unitId"];
        }

        if (newNutrient.isPercentUnit) {
            var percentFloat = parseFloat(newNutrient.percent);
            if (isNaN(percentFloat)) {
                // Probably impossible.
                newNutrient["-error-quantity"] = "Nutrient daily value percent must be a number.";
                hasErrors = true;
            }
            else if (0 >= percentFloat) {
                newNutrient["-error-quantity"] = "Nutrient daily value percent must be positive.";
                hasErrors = true;
            }
            else {
                delete newNutrient["-error-quantity"];
            }
        }
        else {
            var percentFloat = parseFloat(newNutrient.quantity);
            if (isNaN(percentFloat)) {
                // Probably impossible.
                newNutrient["-error-quantity"] = "Nutrient quantity must be a number.";
                hasErrors = true;
            }
            else if (0 >= percentFloat) {
                newNutrient["-error-quantity"] = "Nutrient quantity must be positive.";
                hasErrors = true;
            }
            else {
                delete newNutrient["-error-quantity"];
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
query ($id: Guid!) {
  foodItem(id: $id) {
    id
    name
    brand
    usableAsRecipeIngredient
    usableInFoodJournal
    notes
    recipeBatchDate
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
        name
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
          , recipeBatchDate: data.foodItem.recipeBatchDate
          , generatedFromId: data.foodItem.generatedFrom?.id ?? null
          , nutrients: (data?.foodItem?.foodItemNutrients?.toSorted((n1, n2) => n2.displayOrder - n2.displayOrder) ?? []).map(fin => ({
                isPercentUnit: parseFloat(fin.percent) ? true : false
              , quantity: parseFloat(fin.percent) ? null : fin.quantity
              , percent: fin.percent
              , nutrientId: fin.nutrient.id
              , "-nutrientName": fin.nutrient.name
              , unitId: parseFloat(fin.percent) ? null : fin.unit.id
              , unitOptions: generateNutrientUnitOptions(fin.unit.id, fin.nutrient.currentDailyValue) // TODO: maybe make all these "add-on" things "-property" by convention and then don't send them to the backend.
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

    const checkEmptiesAndAddServingSize = (newFoodItem) => {
        const allHaveValues = newFoodItem.servingSizes.reduce((acc, cur) => acc && (cur.unitId && parseFloat(cur.quantity)) ? true : false, true);
        if (allHaveValues && newFoodItem.servingSizes.length < unitOptions.length) {
            newFoodItem = {...newFoodItem, servingSizes: [... newFoodItem.servingSizes, {...emptyServingSize} ]}
        }
        return newFoodItem;
    };

    const handleServingSizeChange = (index, e) => {
        const { name, value } = e.target;
        const servingSizes = [...foodItem.servingSizes];
        servingSizes[index] = { ...servingSizes[index], [name]: value };
        const newFoodItem = checkEmptiesAndAddServingSize({ ...foodItem, servingSizes: servingSizes});

        validateFoodItem(newFoodItem);
        setFoodItem(newFoodItem)
    };

    const handleServingSizeUnitSelectionChange = (index, selectedOption) => {
        const newServingSizes = [ ...foodItem.servingSizes];
        newServingSizes[index].unitId = selectedOption?.value;
        const newFoodItem = checkEmptiesAndAddServingSize({ ...foodItem, servingSizes: newServingSizes });
        validateFoodItem(newFoodItem);        
        setFoodItem(newFoodItem);
    };

    const handleAddServingSizeButton = () => {
        setFoodItem({ ...foodItem, servingSizes: [...foodItem.servingSizes, {...emptyServingSize}]});
    };

    const handleRemoveServingSizeButton = (index) => {
        const servingSizes = foodItem.servingSizes.filter((_, i) => i !== index);
        setFoodItem({ ...foodItem, servingSizes: servingSizes });
    }

    const handleMoveServingSizeUpButton = (index) => {
        if (index > 0) {
            const servingSizesBefore = foodItem.servingSizes.slice(0, index - 1);
            const servingSizesAfter  = foodItem.servingSizes.slice(index + 1);
            const servingSizes = [...servingSizesBefore, foodItem.servingSizes[index], foodItem.servingSizes[index - 1], ...servingSizesAfter];
            setFoodItem({ ...foodItem, servingSizes: servingSizes});
        }
    }

    const handleMoveServingSizeDownButton = (index) => {
        if (index < foodItem.servingSizes.length - 1) {
            const servingSizesBefore = foodItem.servingSizes.slice(0, index);
            const servingSizesAfter  = foodItem.servingSizes.slice(index + 2);
            const servingSizes = [...servingSizesBefore, foodItem.servingSizes[index + 1], foodItem.servingSizes[index], ...servingSizesAfter];
            setFoodItem({ ...foodItem, servingSizes: servingSizes});
        }
    }

    const checkEmptiesAndAddNutrient = (newFoodItem) => {
        const allHaveValues = newFoodItem.nutrients.reduce((acc, cur) => acc && (cur.nutrientId && cur.unitId && (parseFloat(cur.quantity) || parseFloat(cur.percent))) ? true : false, true);
        if (allHaveValues) {
            newFoodItem = {...newFoodItem, nutrients: [... newFoodItem.nutrients, {...emptyNutrient} ]}
        }
        return newFoodItem;
    };

    const handleNutrientQuantityChange = (index, value) => {
        const nutrients = [...foodItem.nutrients];
        const currentNutrient = nutrients[index];
        if (currentNutrient.isPercentUnit) {
            nutrients[index] = { ...nutrients[index], quantity: null, percent: value };
        }
        else {
            nutrients[index] = { ...nutrients[index], quantity: value, percent: null };
        }
        const newFoodItem = checkEmptiesAndAddNutrient({ ...foodItem, nutrients: nutrients });
        validateFoodItem(newFoodItem);
        setFoodItem(newFoodItem);
    };

    const handleNutrientSelectionChange = (index, selectedOption) => {
        if (selectedOption) {
            const selectedNutrient = selectedOption.nutrient;
            let possibleUnits = Object.values(unitDictionary).filter(u => u.type == selectedNutrient.defaultUnit.type);

            const newNutrients = [ ...foodItem.nutrients];
            newNutrients[index].nutrientId = selectedOption?.value;
            newNutrients[index].unitId = selectedNutrient.defaultUnit.id;

            newNutrients[index].unitOptions = generateNutrientUnitOptions(selectedNutrient.defaultUnit.id, selectedNutrient.currentDailyValue);

            const newFoodItem = checkEmptiesAndAddNutrient({ ...foodItem, nutrients: newNutrients });
            validateFoodItem(newFoodItem);
            setFoodItem(newFoodItem);
        }
        else {
            const newNutrients = [ ...foodItem.nutrients];
            newNutrients[index].nutrientId = null;
            newNutrients[index].unitId = null;
            const newFoodItem = { ...foodItem, nutrients: newNutrients };
            validateFoodItem(newFoodItem);
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

        const newFoodItem = checkEmptiesAndAddNutrient({ ...foodItem, nutrients: newNutrients });
        validateFoodItem(newFoodItem);
        setFoodItem(newFoodItem);
    };

    const handleAddNutrientButton = () => {
        setFoodItem({ ...foodItem, nutrients: [...foodItem.nutrients, {... emptyNutrient }] });
    };

    const handleRemoveNutrientButton = (index) => {
        const nutrients = foodItem.nutrients.filter((_, i) => i !== index);
        setFoodItem({ ...foodItem, nutrients: nutrients });
    };

    const handleMoveNutrientUpButton = (index) => {
        if (index > 0) {
            const nutrientsBefore = foodItem.nutrients.slice(0, index - 1);
            const nutrientsAfter  = foodItem.nutrients.slice(index + 1);
            const newNutrients = [...nutrientsBefore, foodItem.nutrients[index], foodItem.nutrients[index - 1], ...nutrientsAfter];
            setFoodItem({ ...foodItem, nutrients: newNutrients});
        }
    }

    const handleMoveNutrientDownButton = (index) => {
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
            const foodItemToSubmit = {
                ...foodItem
              , servingSizes: foodItem.servingSizes.filter(s => !servingSizeIsEmpty(s))
              , nutrients: foodItem.nutrients.filter(n => !nutrientIsEmpty(n))
            };
            
            if (id) {
                try {
                    const response = await fetch(`/api/fooditems/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(foodItemToSubmit),
                    });
                    
                    setFoodItem(foodItemToSubmit);
                    navigate(`/FoodItemForm/${id}`);
                }
                catch(err) {
                    console.error(err);
                }
            } else {
                try {
                    const response = await fetch('/api/fooditems', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(foodItemToSubmit),
                    });

                    const json = await response.json();
                    setFoodItem(foodItemToSubmit);
                    navigate(`/FoodItemForm/${json.id}`);
                }
                catch(err) {
                    console.error(err);
                }
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
                    <label htmlFor="usableInFoodJournal" className="form-label">Usable in Food Journal:</label>
                    <Select
                        id="usableInFoodJournal"
                        options={yesNoOptions}
                        name="usableInFoodJournal"
                        value={yesNoOptions.filter(opt => opt.value == foodItem.usableInFoodJournal)}
                        onChange={selectedOptions => { handleUsableInFoodJournalChange(selectedOptions) }}
                        styles={{width: "100%"}}
                    />
                </div>
                {foodItem.generatedFromId && (<div className="me-3">
                    <label htmlFor="recipeBatchDate" className="form-label">Recipe Batch Date:</label>
                    <input
                        id="recipeBatchDate"
                        name="recipeBatchDate"
                        type='date'
                        value={foodItem.recipeBatchDate}
                        className="form-control"
                        onChange={handleChange}
                        styles={{width: "100%"}}
                    />
                </div>)}
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

            {(foodItem.generatedFromId) && (
                <>
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
            
            <h5>Serving Sizes</h5>
            {foodItem.generatedFromId && (<div className='mb-3'><em>Serving sizes cannot be edited for food items generated from recipes.</em></div>)}
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
                                    <div className='col'>
                                        <label htmlFor={`servingSize-unit-${index}`} className='visually-hidden'>Unit:</label>
                                        {((foodItem.generatedFromId) && <input className='form-control' value={unitDictionary[servingSize.unitId].name} readOnly disabled />)}
                                        {((!foodItem.generatedFromId) && <Select
                                            id={`servingSize-unit-${index}`}
                                            options={(() => {
                                                const otherSelections = foodItem.servingSizes.filter((_, idx) => idx != index).map(u => u.unitId).filter(typeId => typeId);
                                                const otherSelectedTypes = otherSelections.map(unitId => unitDictionary[unitId].type);

                                                let ret = unitOptions.filter(grp => otherSelectedTypes.indexOf(grp.label) < 0);
                                                return ret;
                                            })()}
                                            isClearable
                                            onChange={(selectedOption) => handleServingSizeUnitSelectionChange(index, selectedOption)}
                                            value={unitOptions.reduce((result, grp) => [...result, ...grp.options], []).find(option => option.value === servingSize.unitId) || null}
                                            classNamePrefix="react-select"
                                            className={`${foodItem["-show-errors"] && servingSize["-error-unitId"] ? 'is-invalid' : ''}`}
                                            placeholder="unit"
                                        />)}
                                        {(foodItem["-show-errors"] && (<div className='error-message'>{servingSize["-error-unitId"]}</div>))}
                                    </div>
                                </div>
                            </td>
                            <td style={{width:"33%"}}>
                                <div className="form-group">
                                    <div>
                                        <label htmlFor={`servingSize-quantity-${index}`} className='visually-hidden'>Unit:</label>
                                        <input
                                            id={`servingSize-quantity-${index}`}
                                            type="number"
                                            name="quantity"
                                            className={`form-control ${(foodItem["-show-errors"] && servingSize["-error-quantity"]) ? "is-invalid" : ""}`}
                                            value={servingSize.quantity}
                                            onChange={(e) => handleServingSizeChange(index, e)}
                                            placeholder="quantity"
                                            readOnly={foodItem.generatedFromId}
                                            disabled={foodItem.generatedFromId}
                                        />
                                        {(foodItem["-show-errors"] && (<div className='error-message'>{servingSize["-error-quantity"]}</div>))}
                                    </div>
                                </div>
                            </td>
                            {!(foodItem.generatedFromId) && (
                                <td style={{width: "1%", whiteSpace: "nowrap"}}>
                                    <div className="form-group">
                                        <div className="col-auto align-self-end">
                                            <div className="btn-group" role="group" aria-label="Button group">
                                                <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => handleMoveServingSizeUpButton(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                                                <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => handleMoveServingSizeDownButton(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                                                <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => handleRemoveServingSizeButton(index)}><i className="bi bi-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {!(foodItem.generatedFromId) && (<button type="button" className="btn btn-secondary mb-3" disabled={foodItem.servingSizes.length >= unitOptions.length} onClick={handleAddServingSizeButton}>Add Serving Size</button>)}

            <h5>Nutrition Information per Serving</h5>
            {foodItem.generatedFromId && (<div className='mb-3'><em>Nutrition information cannot be edited for food items generated from recipes.</em></div>)}
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
                                    <div className="col">
                                        <label htmlFor={`servingSize-unit-type-${index}`} className='visually-hidden'>Nutrient</label>
                                        {((foodItem.generatedFromId) && <input className='form-control' value={nutrient["-nutrientName"]} readOnly disabled />)}
                                        {((!foodItem.generatedFromId) && <Select
                                            id={`servingSize-unit-type-${index}`}
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
                                        />)}
                                        {(foodItem["-show-errors"] && (<div className='error-message'>{nutrient["-error-nutrientId"]}</div>))}
                                    </div>
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
                                            readOnly={foodItem.generatedFromId}
                                            disabled={foodItem.generatedFromId}
                                            className={`form-control ${(foodItem["-show-errors"] && nutrient["-error-quantity"]) ? "is-invalid" : ""}`}
                                            value={((x) => foodItem.generatedFromId ? Math.round(x) : x)(nutrient.percent ?? nutrient.quantity ?? 0)}
                                            onChange={(e) => handleNutrientQuantityChange(index, e.target.value)}
                                            placeholder="Quantity"
                                        />
                                        {(foodItem["-show-errors"] && (<div className='error-message'>{nutrient["-error-quantity"]}</div>))}
                                    </div>
                                </div>
                            </td>
                            <td style={{width:"33%"}}>
                                <div className="form-group">
                                    <div className="col">
                                        <label htmlFor={`foodItem-unit-type-${index}`} className='visually-hidden'>Quantity Unit</label>
                                        {((foodItem.generatedFromId) && <input className='form-control' value={nutrient.isPercentUnit ? nutrient.percent : unitDictionary[nutrient.unitId].name} readOnly disabled />)}
                                        {((!foodItem.generatedFromId) && <Select
                                            id={`foodItem-unit-type-${index}`}
                                            name="unitId"
                                            options={nutrient.unitOptions}
                                            onChange={(selectedOption) => handleNutrientUnitChange(selectedOption, index)}
                                            classNamePrefix="react-select"
                                            className={`${foodItem["-show-errors"] && nutrient["-error-unitId"] ? 'is-invalid' : ''}`}
                                            value={parseFloat(nutrient.percent) ? unitPercentOption : nutrient?.unitOptions?.find(option => {
                                                return option?.value === nutrient.unitId}
                                            ) || null}
                                        />)}
                                        {(foodItem["-show-errors"] && (<div className='error-message'>{nutrient["-error-unitId"]}</div>))}
                                    </div>
                                </div>
                            </td>
                            {!(foodItem.generatedFromId) && (
                                <td style={{width: "1%", whiteSpace: "nowrap"}}>
                                    <div className="form-group">
                                        <div className="col-auto align-self-end">
                                            <div className="btn-group" role="group" aria-label="Button group">
                                                <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => handleMoveNutrientUpButton(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                                                <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => handleMoveNutrientDownButton(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                                                <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => handleRemoveNutrientButton(index)}><i className="bi bi-trash"></i></button>
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
                            <button type="button" className="btn btn-secondary" disabled={foodItem.nutrients.length >= ungroupOptions(nutrientOptions).length} onClick={handleAddNutrientButton}>Add Nutrient</button>
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
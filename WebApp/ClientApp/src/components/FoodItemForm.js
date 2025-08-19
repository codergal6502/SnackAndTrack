import { useState, useEffect } from 'react';
import { useParams, useNavigate, useResolvedPath } from 'react-router-dom';
import { displayOrderCompareFn, ungroupOptions, yesNoOptions, roundToTwoPlaces, useUnits, useNutrients } from '../utilties';

import Select from 'react-select';
import Modal from 'react-bootstrap/Modal';

// Options
const unitPercent = {
    "id": "",
    "name": "Percent Daily Value",
    "type": "Percent",
    "abbreviationCsv": "%",
}
const unitPercentOption = { label: "Percent", value: "", unit: unitPercent, isPercentUnit: true };

// Default or empty state bits.
const emptyServingSize = { unitId: "", quantity: "", unitType: "" };
const emptyNutrient = { quantity: "", percent: null, nutrientId: null, unitId: null };
const defaultModalState = { showSuccess: false, showDuplicated: false, showError: false, errorHttpStatus: null, errorMessage: null };

// Utilities
const servingSizeIsEmpty = s => "" == ((s.unitId || "").toString() + (s.quantity || "").toString()).trim();
const nutrientIsEmpty = n => "" == ((n.nutrientId || "").toString() + (n.quantity || "").toString() + (n.unitId || "").toString()).trim();

const FoodItemForm = () => {
    // Form and UI State Objects
    const [foodItem, setFoodItem] = useState({ name: '', brand: '', notes: '', generatedFromId: null, generatedFromName: null, servingSizes: [ {... emptyServingSize} ], nutrients: [ {... emptyNutrient} ], "-show-errors": false });
    const [nutritionTable, setNutritionTable] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [modalState, setModalState] = useState(defaultModalState);
    const [ready, setReady] = useState();

    // Lookups and Options
    const [unitDictionary, unitOptions] = useUnits();
    const [_, nutrientOptions] = useNutrients();
    
    const foodItemPath = useResolvedPath("/RecipeForm");
    const { id } = useParams();
    const navigate = useNavigate();

    // Loading
    useEffect(() => {
        document.title = "Snack and Track: Edit Food Item";
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
    recipeNutritionTableJson
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
        const body = JSON.stringify({query, variables: { "id": id }});

        const response = await fetch('/graphql/query', {method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body});

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
          , generatedFromName: data.foodItem.generatedFrom?.name ?? null
          , nutrients: (data?.foodItem?.foodItemNutrients?.toSorted((n1, n2) => n2.displayOrder - n2.displayOrder) ?? []).map(fin => ({
                isPercentUnit: parseFloat(fin.percent) ? true : false
              , quantity: roundToTwoPlaces(fin.quantity) || null
              , percent: roundToTwoPlaces(fin.percent) || null
              , nutrientId: fin.nutrient.id
              , "-nutrientName": fin.nutrient.name
              , unitId: parseFloat(fin.percent) ? null : fin.unit.id
              , unitOptions: generateNutrientUnitOptions(fin.unit.id, fin.nutrient.currentDailyValue) // TODO: maybe make all these "add-on" things "-property" by convention and then don't send them to the backend.
            }))
          , servingSizes: (data.foodItem?.servingSizes?.toSorted((n1, n2) => n2.displayOrder - n2.displayOrder) ?? []).map(s => ({
                unitId: s.unit.id
              , unitType: s.unit.type
              , quantity: roundToTwoPlaces(s.quantity)
            }))
        };

        setFoodItem(foodItem);

        if (data.foodItem.recipeNutritionTableJson) {
            try {
                const newNutritionTable = JSON.parse(data.foodItem.recipeNutritionTableJson);
                setNutritionTable(newNutritionTable);
            }
            catch(err) {
                console.log(err);
            }
        }
    };

    const generateNutrientUnitOptions = (unitId, showPercent) => {
        const possibleUnits = Object.values(unitDictionary).filter(u => u.type == unitDictionary[unitId].type)
    
        let possibleOptions = possibleUnits.map(u => ({ label: u.name, value: u.id, unit: u, isPercentUnit: false }));
        if (showPercent) {
            possibleOptions = [unitPercentOption, ...possibleOptions];
        }

        return possibleOptions;
    };

    //#region Validation

    const validateAndSetFoodItem = (foodItem) => {
        const newFoodItem = { ... foodItem, "-show-errors": true };
        validateFoodItem(newFoodItem);
        
        setFoodItem(newFoodItem);
        return newFoodItem["-has-errors"];
    }

    const validateFoodItemAndMarkAsChanged = (newFoodItem) => {
        setHasUnsavedChanges(true);

        return validateFoodItem(newFoodItem);
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

    //#endregion Validation

    //#region Handlers and Related Utilities

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFoodItem = { ...foodItem, [name]: value };
        validateFoodItemAndMarkAsChanged(newFoodItem);
        setFoodItem({ ...newFoodItem, [name]: value });
    };

    const handleUsableAsRecipeIngredient = (selectedOption) => {
        const newFoodItem = { ...foodItem, usableAsRecipeIngredient: selectedOption.value };
        validateFoodItemAndMarkAsChanged(newFoodItem);
        setFoodItem({ ...newFoodItem });
    }

    const handleUsableInFoodJournalChange = (selectedOption) => {
        const newFoodItem = { ...foodItem, usableInFoodJournal: selectedOption.value };
        validateFoodItemAndMarkAsChanged(newFoodItem);
        setFoodItem({ ...newFoodItem });
    }

    //#region Serving Sizes

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

        validateFoodItemAndMarkAsChanged(newFoodItem);
        setFoodItem(newFoodItem)
    };

    const handleServingSizeUnitSelectionChange = (index, selectedOption) => {
        const newServingSizes = [ ...foodItem.servingSizes];
        newServingSizes[index].unitId = selectedOption?.value;
        const newFoodItem = checkEmptiesAndAddServingSize({ ...foodItem, servingSizes: newServingSizes });
        validateFoodItemAndMarkAsChanged(newFoodItem);        
        setFoodItem(newFoodItem);
    };

    const handleAddServingSizeButton = () => {
        setFoodItem({ ...foodItem, servingSizes: [...foodItem.servingSizes, {...emptyServingSize}]});
    };

    const handleRemoveServingSizeButton = (index) => {
        const servingSizes = foodItem.servingSizes.filter((_, i) => i !== index);
        const newFoodItem = { ...foodItem, servingSizes: servingSizes };
        validateFoodItemAndMarkAsChanged(newFoodItem);
        setFoodItem(newFoodItem);
    }

    const handleMoveServingSizeUpButton = (index) => {
        if (index > 0) {
            const servingSizesBefore = foodItem.servingSizes.slice(0, index - 1);
            const servingSizesAfter  = foodItem.servingSizes.slice(index + 1);
            const servingSizes = [...servingSizesBefore, foodItem.servingSizes[index], foodItem.servingSizes[index - 1], ...servingSizesAfter];
            const newFoodItem = { ...foodItem, servingSizes: servingSizes };
            validateFoodItemAndMarkAsChanged(newFoodItem);
            setFoodItem(newFoodItem);
        }
    }

    const handleMoveServingSizeDownButton = (index) => {
        if (index < foodItem.servingSizes.length - 1) {
            const servingSizesBefore = foodItem.servingSizes.slice(0, index);
            const servingSizesAfter  = foodItem.servingSizes.slice(index + 2);
            const servingSizes = [...servingSizesBefore, foodItem.servingSizes[index + 1], foodItem.servingSizes[index], ...servingSizesAfter];
            const newFoodItem = { ...foodItem, servingSizes: servingSizes };
            validateFoodItemAndMarkAsChanged(newFoodItem);
            setFoodItem(newFoodItem);
        }
    }

    //#endregion Serving Sizes

    //#region Nutrients

    const checkEmptiesAndAddNutrient = (newFoodItem) => {
        const allHaveValues = newFoodItem.nutrients.reduce((acc, cur) => acc && (cur.nutrientId && cur.unitId && (parseFloat(cur.quantity) || parseFloat(cur.percent))) ? true : false, true);
        if (allHaveValues && (newFoodItem.nutrients.length < ungroupOptions(nutrientOptions).length)) {
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
        validateFoodItemAndMarkAsChanged(newFoodItem);
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
            validateFoodItemAndMarkAsChanged(newFoodItem);
            setFoodItem(newFoodItem);
        }
        else {
            const newNutrients = [ ...foodItem.nutrients];
            newNutrients[index].nutrientId = null;
            newNutrients[index].unitId = null;
            const newFoodItem = { ...foodItem, nutrients: newNutrients };
            validateFoodItemAndMarkAsChanged(newFoodItem);
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
        validateFoodItemAndMarkAsChanged(newFoodItem);
        setFoodItem(newFoodItem);
    };

    const handleAddNutrientButton = () => {
        setFoodItem({ ...foodItem, nutrients: [...foodItem.nutrients, {... emptyNutrient }] });
    };

    const handleRemoveNutrientButton = (index) => {
        const nutrients = foodItem.nutrients.filter((_, i) => i !== index);
        const newFoodItem = { ...foodItem, nutrients: nutrients };
        validateFoodItemAndMarkAsChanged(newFoodItem);
        setFoodItem(newFoodItem);
    };

    const handleMoveNutrientUpButton = (index) => {
        if (index > 0) {
            const nutrientsBefore = foodItem.nutrients.slice(0, index - 1);
            const nutrientsAfter  = foodItem.nutrients.slice(index + 1);
            const newNutrients = [...nutrientsBefore, foodItem.nutrients[index], foodItem.nutrients[index - 1], ...nutrientsAfter];
            const newFoodItem = { ...foodItem, nutrients: newNutrients };
            validateFoodItemAndMarkAsChanged(newFoodItem);
            setFoodItem(newFoodItem);
        }
    }

    const handleMoveNutrientDownButton = (index) => {
        if (index < foodItem.nutrients.length - 1) {
            const nutrientsBefore = foodItem.nutrients.slice(0, index);
            const nutrientsAfter  = foodItem.nutrients.slice(index + 2);
            const newNutrients = [...nutrientsBefore, foodItem.nutrients[index + 1], foodItem.nutrients[index], ...nutrientsAfter];
            const newFoodItem = { ...foodItem, nutrients: newNutrients };
            validateFoodItemAndMarkAsChanged(newFoodItem);
            setFoodItem(newFoodItem);
        }
    }

    //#endregion Nutrients

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hasErrors = validateAndSetFoodItem(foodItem);

        if (!hasErrors) {

            const foodItemToSubmit = {
                ...foodItem
              , "-show-errors": false
              , servingSizes: foodItem.servingSizes.filter(s => !servingSizeIsEmpty(s))
              , nutrients: foodItem.nutrients.filter(n => !nutrientIsEmpty(n))
            };
            
            try {
                if (id) {
                    const response = await fetch(`/api/fooditems/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(foodItemToSubmit),
                    });
                    
                    if (response.ok) {
                        setFoodItem(foodItemToSubmit);
                        setModalState({...defaultModalState, showSuccess: true});
                        setHasUnsavedChanges(false);
                    }
                    else {
                        setModalState(
                            {
                                ...defaultModalState
                              , showError: true
                              , errorHttpStatus: response.status
                              , errorMessage: (await response.text())?.toString()?.trim() ?? response.statusText
                            }
                        );
                    }
                } else {
                    const response = await fetch('/api/fooditems', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(foodItemToSubmit),
                    });

                    if (response.ok) {
                        const json = await response.json();
                        setFoodItem(foodItemToSubmit);
                        navigate(`/FoodItemForm/${json.id}`);
                        setModalState({...defaultModalState, showSuccess: true});
                        setHasUnsavedChanges(false);
                    }
                    else {
                        setModalState(
                            {
                                ...defaultModalState
                              , showError: true
                              , errorHttpStatus: response.status
                              , errorMessage: (await response?.text())?.toString()?.trim() ?? response.statusText
                            }
                        );
                    }
                }
            }
            catch (err) {
                setModalState(
                    {
                        ...defaultModalState
                      , showError: true
                      , errorMessage: await err.toString()
                    }
                );
            }
        }
    };

    const handleDuplicateButton = () => {
        const newFoodItem = { ... foodItem, "-show-errors": false };
        setFoodItem(newFoodItem);
        setHasUnsavedChanges(true);
        setModalState({...modalState, showDuplicated: true});
        navigate(`/FoodItemForm`);
    }

    //#endregion Handlers and Related Utilities

    return ready && (
        <form autoComplete="off" onSubmit={handleSubmit}>
            <h4>Food Item</h4>
            {(foodItem["-show-errors"] && foodItem["-has-errors"]) && (<div className='error-message mb-2'>Please correct any errors and try saving again.</div>)}
            {(foodItem.generatedFromId && <div className='mb-2'>This food item was generated from recipe <a href={`${foodItemPath.pathname}/${foodItem.generatedFromId}`} onClick={(e) => { e.preventDefault(); navigate(`/RecipeForm/${foodItem.generatedFromId}`) }}>{foodItem.generatedFromName}</a>.</div>)}
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
            {nutritionTable && (
                <>
                    <h5>Nutrition</h5>
                    <table className='table table-striped table-bordered'>
                        <thead>
                            <tr>
                                <th scope='col'>Nutrient</th>
                                {(nutritionTable.recipeIngredients.toSorted(displayOrderCompareFn).map((ingredient, index) => (
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
                                    {(nutritionTable.recipeIngredients.toSorted(displayOrderCompareFn).map((ingredient, index) => {
                                        const [foodItemContribution] = nutrientSummary.foodItemContributions.filter(fic => fic.foodItemId === ingredient.foodItemId);
                                        const rounded = Math.round(foodItemContribution.nutrientQuantity)
                                        return (
                                            <td key={index}>{ typeof(foodItemContribution.nutrientQuantity) != "number" ?  '-' : `${rounded } ${foodItemContribution.nutrientUnitName}` }</td>
                                        );
                                    }))}
                                    <td>{Math.round(nutrientSummary.totalQuantity)} {nutrientSummary.nutrientUnitName} {(nutrientSummary.percentDailyValue) && ( `(${Math.round(nutrientSummary.percentDailyValue)}% dv)` ) }</td>
                                </tr>
                            );}))}
                        </tbody>
                    </table>
                </>
            )}

            {!(foodItem.generatedFromId) && (
                <>
                    <div className="row mb-3">
                        <div className="col-auto align-self-end">
                            <button type="button" className="btn btn-secondary" disabled={foodItem.nutrients.length >= ungroupOptions(nutrientOptions).length} onClick={handleAddNutrientButton}>Add Nutrient</button>
                        </div>
                    </div>
                    <h5>Actions</h5>
                    {hasUnsavedChanges && (<div className='fst-italic mb-2'>You have unsaved changes. Please save to perform actions other than saving or cancelling.</div>)}
                    <div className="mb-3 btn-toolbar d-flex justify-content-between" role="toolbar" aria-label="Actions">
                        <div className="btn-group" role="group">
                            <button type="submit" className="btn btn-primary">Save</button>
                            <button type="button" className={`btn ${hasUnsavedChanges ? "btn-outline-dark" : "btn-outline-primary"}`} disabled={hasUnsavedChanges} onClick={handleDuplicateButton}>Duplicate</button>
                        </div>
                        <div className="btn-group" role="group">
                            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1) }>Cancel</button>
                        </div>
                    </div>
                </>
            )}
            
            <Modal show={modalState.showSuccess}>
                <Modal.Header><h3>Food Item Saved</h3></Modal.Header>
                <Modal.Body><div className='text-center'>Food Item Saved</div></Modal.Body>
                <Modal.Footer>
                    <div className='text-center'>
                        <button type='button' className='btn btn-primary' onClick={() => { setModalState({...defaultModalState}); }}>OK</button>
                    </div>
                </Modal.Footer>
            </Modal>
            
            <Modal show={modalState.showDuplicated}>
                <Modal.Header><h3>Food Item Duplicated</h3></Modal.Header>
                <Modal.Body><div className='text-center'>Press <span className='fst-italic'>Save</span> to finish duplicating the food item.</div></Modal.Body>
                <Modal.Footer>
                    <div className='text-center'>
                        <button type='button' className='btn btn-primary' onClick={() => { setModalState({...defaultModalState}); }}>OK</button>
                    </div>
                </Modal.Footer>
            </Modal>

            <Modal show={modalState.showError}>
                <Modal.Header><h3 className='text-center mb-0 fst-italic'>Oh, No!</h3></Modal.Header>
                <Modal.Body>
                    <div className='fw-bold mb-2'>An unexpected error has occurred.</div>
                    {modalState.errorHttpStatus && (
                        <div className='px-2'>HTTP {modalState.errorHttpStatus}</div>
                    )}
                    {modalState.errorMessage && (
                        <div className='px-2'>
                            <textarea id="error-textarea" disabled="disabled" defaultValue={modalState.errorMessage} style={{fontSize: ".75em", maxHeight: "10em"}} readOnly className='form-control font-monospace'/>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className='text-center'>
                        <button type='button' className='btn btn-primary' onClick={() => { setModalState({...defaultModalState}); }}>OK</button>
                    </div>
                </Modal.Footer>
            </Modal>
        </form>
    );
};

export default FoodItemForm;
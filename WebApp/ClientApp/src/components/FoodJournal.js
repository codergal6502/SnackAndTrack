import { useEffect, useState } from 'react';
import React, { Component } from 'react';
import Select from 'react-select';
import { useSearchParams } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import ModalHeader from 'react-bootstrap/esm/ModalHeader';

const FoodJournal = () => {
    // make it so users can bookmark and navigate
    const [searchParams, setSearchParams] = useSearchParams();

    const defaultPopupState = { visible: false, quantity: '', foodItemOptions: [ ], selectedFoodItemOption: null, unitOptions: [ ], selectedUnitOption: null, "-show-errors": false };
    const defaultJournalEntry = { foodItem: null, unit: null, quantity: null, time: null, nutrients: { } };

    // backing objects
    const [calendarState, setCalendarState] = useState({ journalEntries: [ {... defaultJournalEntry } ] })
    const [foodItemPopupState, setFoodItemPopupState] = useState({... defaultPopupState })

    // lookups and select iptions
    const [unitDictionary, setUnitDictionary] = useState({});
    const [unitOptions, setUnitOptions] = useState([]); // Empty 2D-array

    const [nutritionGoalSetDictionary, setNutritionGoalSetDictionary] = useState();
    const [nutritionGoalSetOptions, setNutritionGoalSetOptions] = useState(null);

    useEffect(() => {
        fetchNutritionalGoalSets();
        fetchUnits();
    }, []);

    useEffect(() => {
        if (nutritionGoalSetDictionary && nutritionGoalSetOptions) {
            const jsObj = getOldSearchParamsAsJsObject(searchParams);
            setCalendarState(populateCalendarStateByParameters({...calendarState, parameters: jsObj}));
        }
    }, [nutritionGoalSetDictionary, nutritionGoalSetOptions])

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
                          , unit: unit
                        }))
                    }));

            setUnitOptions(groupedOptions);
        }
        catch (error) {
            console.error(`Request to ${url} failed.`, error)
        }
    }

    const fetchFoodItems = async (qName) => {
        const query = `
query GetFoodItems($qName: String!) {
  foodItems(name: $qName) {
    items {
      id
      name
      foodItemNutrients {
        quantity
        nutrient {
          name
          group
        }
        quantity
        unit {
          name
          type
        }
      }
      servingSizes {
        quantity
        unit {
          name
          type
          abbreviationCsv
        }
      }
    }
  }
}`;

        const body=JSON.stringify({query, variables: { qName }});
        const response = await fetch('/graphql/query', {
            method: 'POST'
          , headers: {
                'Content-Type': 'application/json'
            }
          , body: body
        });
        
        const { data } = await response.json();
        const foodItems = data.foodItems.items;

        return foodItems;
    }

    const handleFoodItemLookupInputChange = async (qName) => {
        if (!qName) {
            return;
        }
        
        try {
            const foodItems = await fetchFoodItems(qName);
            const foodItemOptions = foodItems.map(fi => ({ label: fi.name, value: fi.id, foodItem: fi }));
            
            const newFoodItemPopupState = {... foodItemPopupState, foodItems: foodItems, foodItemOptions: foodItemOptions};
            setFoodItemPopupState(newFoodItemPopupState);
        }
        catch (error) {
            console.error("Request to /api/fooditems failed.", error)
        }
    };

    const handleFoodItemSelectionChange = async (selectedOption) => {
        if (selectedOption) {
            const selectedFoodItem = selectedOption.foodItem;
            const possibleUnitTypes = selectedFoodItem.servingSizes.map(s => s.unit.type);
            const possibleUnitOptions = unitOptions.filter(uo => possibleUnitTypes.indexOf(uo.label) >= 0 );
                
            const newFoodItemPopupState = {... foodItemPopupState, selectedFoodItemOption: selectedOption, unitOptions: possibleUnitOptions };
            populateErrorsInFoodItemPopup(newFoodItemPopupState);
            setFoodItemPopupState(newFoodItemPopupState);
        }
        else {
            const newFoodItemPopupState = {... foodItemPopupState, selectedFoodItemOption: null, unitOptions: null };
            populateErrorsInFoodItemPopup(newFoodItemPopupState);
            setFoodItemPopupState(newFoodItemPopupState);
        }
    }

    const handleFoodItemUnitChange = (selectedOption) => {
        const newFoodItemPopupState = {... foodItemPopupState, selectedUnitOption: selectedOption };
        populateErrorsInFoodItemPopup(newFoodItemPopupState);
        setFoodItemPopupState(newFoodItemPopupState);
    }

    const handleFoodItemQuantityChange = (quantity) => {
        const newFoodItemPopupState = {... foodItemPopupState, quantity: quantity };
        populateErrorsInFoodItemPopup(newFoodItemPopupState);
        setFoodItemPopupState(newFoodItemPopupState);
    }

    const editFoodOnClick = (index) => {
        const journalEntry = calendarState.journalEntries[index];
        setFoodItemPopupState({
            ...defaultPopupState
          , visible: true
          , journalEntryIndex: index
          , selectedFoodItemOption: ! journalEntry.foodItem ? null : { label: journalEntry.foodItem.name, value: journalEntry.foodItem.id }
          , selectedUnitOption: ! journalEntry.unit ? null : { label: journalEntry.unit.name, value: journalEntry.unit.id }
          , quantity: journalEntry.quantity 
        });
    }
    
    const handleModalOpen = () => {
        setFoodItemPopupState({...foodItemPopupState, "-show-errors": false})
    }

    const handleModalCancelClose = (e) => {
        setFoodItemPopupState({...foodItemPopupState, visible: false});
    }
    
    const handleModalSaveButtonClick = (e) => {
        let newFoodItemPopupState = {...foodItemPopupState, "-show-errors": true};
        if (populateErrorsInFoodItemPopup(newFoodItemPopupState)) {
            setFoodItemPopupState(newFoodItemPopupState);
        }
        else {
            const newJournalEntry = {
                foodItem: foodItemPopupState.selectedFoodItemOption.foodItem
              , unit: foodItemPopupState.selectedUnitOption.unit
              , quantity: foodItemPopupState.quantity
              , time: null
              , nutrients: { }
            }

            const newJournalEntries = [...calendarState.journalEntries, {...defaultJournalEntry}];
            newJournalEntries[foodItemPopupState.journalEntryIndex] = newJournalEntry;
            setCalendarState({...calendarState, journalEntries: newJournalEntries});
            setFoodItemPopupState({... defaultPopupState });
        }
    }

    const populateErrorsInFoodItemPopup = (newFoodItemPopupState) => {
        let hasErrors = false;

        if (!newFoodItemPopupState.selectedFoodItemOption) {
            newFoodItemPopupState["-error-foodItem"] = "You must select a food item.";
            hasErrors = true;
        }
        else {
            delete newFoodItemPopupState["-error-foodItem"];
        }

        if (!newFoodItemPopupState.selectedUnitOption) {
            newFoodItemPopupState["-error-unit"] = "You must select a unit.";
            hasErrors = true;
        }
        else {
            delete newFoodItemPopupState["-error-unit"];
        }
        
        const quantityIsNull = !newFoodItemPopupState.quantity?.toString()?.trim();
        const parsedQuantity = parseInt(newFoodItemPopupState.quantity);
        
        if (quantityIsNull) {
            newFoodItemPopupState["-error-quantity"] = "You must specify how much."
            hasErrors = true;
        }
        else if (isNaN(parsedQuantity)) {
            newFoodItemPopupState["-error-quantity"] = "Quantity must be a valid number."
            hasErrors = true;
        }
        else if (0 > parsedQuantity) {
            newFoodItemPopupState["-error-quantity"] = "Quantity must greater than 0."
            hasErrors = true;
        }
        else {
            delete newFoodItemPopupState["-error-quantity"];
        }

        return hasErrors;
    }

    const populateCalendarStateByParameters = (calendarState) => {
        const calendarDate = new Date(calendarState.parameters?.calendarDate)

        let nutrientTargets = [ ];

        for (const ngsId of (calendarState.parameters?.nutritionGoals ?? [])) {
            let nutritionGoal = nutritionGoalSetDictionary[ngsId];

            const nutritionGoalStartDate = new Date(nutritionGoal.startDate);
            const dayDifferce = Math.ceil((calendarDate - nutritionGoalStartDate) / (1000 * 60 * 60 * 24));

            for (const nutrient of nutritionGoal.nutrients) {
                const nutrientTarget = {
                    nutrientName: nutrient.nutrient.name
                  , calendarDate
                  , nutritionGoalStartDate
                  , dayDifferce
                  , dayInPeriod: dayDifferce % nutritionGoal.period
                  , period: nutritionGoal.period
                  , targets: nutrient.targets//.filter(t => t.start <= dayDifferce && dayDifferce <= t.end)[0]
                  , target: nutrient.targets.filter(t => t.start <= dayDifferce % nutritionGoal.period && dayDifferce % nutritionGoal.period <= t.end)[0]
                };

                nutrientTargets.push(nutrientTarget);
            }
        };

        calendarState = {... calendarState, nutrientTargets: nutrientTargets };

        return calendarState;
    }

    const getOldSearchParamsAsJsObject = (/** @type {URLSearchParams} */ searchParams) => {
        let oldSearchParamsAsJsObject = {};
        
        for (const key of Array.from(searchParams.keys())) {
            oldSearchParamsAsJsObject = { ... oldSearchParamsAsJsObject, [key]: searchParams.getAll(key) };
        }
        return oldSearchParamsAsJsObject;
    }

    const handleCalendarDateChange = (newCalendarDate) => {
        let oldSearchParamsAsJsObject = getOldSearchParamsAsJsObject(searchParams);
        
        const newSearchParams = { ...oldSearchParamsAsJsObject, calendarDate: newCalendarDate };
        setSearchParams(newSearchParams);
        setCalendarState(populateCalendarStateByParameters({...calendarState, parameters: newSearchParams}));
    }

    const handleGoalChange = (selectedOptions) => {
        let oldSearchParamsAsJsObject = getOldSearchParamsAsJsObject(searchParams);
        
        const newSearchParams = { ...oldSearchParamsAsJsObject, nutritionGoals: selectedOptions.map(so => so.value) };
        setSearchParams(newSearchParams);
        setCalendarState(populateCalendarStateByParameters({...calendarState, parameters: newSearchParams}));
    }

    const fetchNutritionalGoalSets = async () => {
        const query = `
{
  nutritionGoalSets {
    items {
      id
      name
      startDate
      endDate
      period
      dayModes:nutritionGoalSetDayModes {
        dayNumber
        type
      }
      nutrients:nutritionGoalSetNutrients {
        targets:nutritionGoalSetNutrientTargets {
          minimum
          maximum
          start
          end
        }
        nutrient {
          name
          defaultUnit {
            name
          }
        }
      }
    }
  }
}
        `;

        const body = JSON.stringify({query});

        const response = await fetch("/graphql/query", {
            method: 'POST'
          , headers: {
                'Content-Type': 'application/json'
            }
          , body: body
        });

        const { data } = await response.json();
        
        const dictionary = data.nutritionGoalSets.items.reduce((acc, cur, idx) => { acc = { ...acc, [cur.id]: cur }; return acc; }, {});
        setNutritionGoalSetDictionary(dictionary);
        setNutritionGoalSetOptions(data.nutritionGoalSets.items.map(ngs => ({ label: ngs.name, value: ngs.id })));
    };

    return (
        <div>
            <h1>Food Journal</h1>
            <div className="d-flex mb-3">
                <div className="me-3">
                    <label htmlFor="calendarDate" className="form-label">Start Date:</label>
                    <input type="date" id="calendarDate" name="calendarDate" className='form-control' onChange={e => handleCalendarDateChange(e.target.value)} value={calendarState.parameters?.calendarDate || ""} />
                </div>
                <div className="me-3">
                    <label htmlFor="showGoals" className="form-label">Show Nutrition Goals:</label>
                    <Select
                        options={nutritionGoalSetOptions}
                        isMulti={true}
                        isClearable={false}
                        onChange={s => handleGoalChange(s)}
                        value={nutritionGoalSetOptions?.filter(opt => (calendarState.parameters?.nutritionGoals ?? []).indexOf(opt.value) >= 0)}
                    />
                </div>
                <div className="me-3">
                    <label className="form-label">&nbsp;</label>
                    <button type="button" className='btn btn-info form-control' onClick={() => {debugger; console.log(calendarState);}}>refresh</button>
                </div>
            </div>
            
            <table className='table table-striped table-bordered'>
                <thead>
                    <tr>
                        <th scope='row'>Nutrient</th>
                        {calendarState.nutrientTargets?.map((nt, idx) => <th scope="col" key={idx} style={{width: `${(2 + calendarState.nutrientTargets?.count) * 100}%`}}>{nt.nutrientName}</th>)}
                    </tr>
                    <tr>
                        <th scope='row'>Target</th>
                        {calendarState.nutrientTargets?.map((nt, idx) => <th scope="col" key={idx}>{nt.target.minimum}-{nt.target.maximum}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {calendarState.journalEntries.map((ce, idx) => 
                        <tr key={idx}>
                            <td>
                                <div className='input-group'>
                                    <input readOnly className='form-control' value={ce.foodItem && ce.unit && ce.quantity ? `${ce.foodItem.name}, ${ce.quantity} ${ce.unit.name}` : ''} />
                                    <button className='btn btn-secondary' onClick={() => editFoodOnClick(idx)}><i className="bi bi-pencil-square"></i></button>
                                </div>
                            </td>
                            {calendarState.nutrientTargets?.map((nt, idx) => <td scope="col" key={idx} style={{width: `${(2 + calendarState.nutrientTargets?.count) * 100}%`}}>{0}</td>)}
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr>
                        <th>Total</th>
                    </tr>
                </tfoot>
            </table>

            <Modal show={foodItemPopupState.visible} onShow={handleModalOpen} onHide={handleModalCancelClose} centered>
                <Modal.Header>Record Food</Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <label htmlFor="foodItemSelect" className='form-label'>Food Item:</label>
                        <Select
                            options={foodItemPopupState?.foodItemOptions ?? []}
                            onInputChange={(text) => { handleFoodItemLookupInputChange(text) }}
                            onChange={selectedOption => handleFoodItemSelectionChange(selectedOption)}
                            isClearable
                            value={foodItemPopupState.selectedFoodItemOption}
                            classNamePrefix="react-select"
                            className={`${foodItemPopupState["-show-errors"] && foodItemPopupState["-error-foodItem"] ? 'is-invalid' : ''}`}
                        />
                        {(foodItemPopupState["-show-errors"] && (<div className='error-message'>{foodItemPopupState["-error-foodItem"]}</div>))}
                        <label htmlFor="unitSelect" className='form-label'>Unit:</label>
                        <Select
                            id="unitSelect"
                            options={foodItemPopupState?.unitOptions ?? []}
                            isClearable
                            onChange={(selectedOption) => { handleFoodItemUnitChange(selectedOption) }}
                            value={foodItemPopupState.selectedUnitOption}
                            classNamePrefix="react-select"
                            className={`${foodItemPopupState["-show-errors"] && foodItemPopupState["-error-unit"] ? 'is-invalid' : ''}`}
                            placeholder="unit"
                        />
                        {(foodItemPopupState["-show-errors"] && (<div className='error-message'>{foodItemPopupState["-error-unit"]}</div>))}
                        <label htmlFor="quantity" className='form-label'>Quantity</label>
                        <input
                            id="quantity"
                            type="number"
                            onChange={(e) => { handleFoodItemQuantityChange(e.target.value) }}
                            value={foodItemPopupState.quantity}
                            className={`form-control ${(foodItemPopupState["-show-errors"] && foodItemPopupState["-error-quantity"]) ? "is-invalid" : ""}`}
                            placeholder={foodItemPopupState?.selectedUnitOption?.unit?.name}
                        />
                        {(foodItemPopupState["-show-errors"] && (<div className='error-message'>{foodItemPopupState["-error-quantity"]}</div>))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button type='button' className='btn btn-primary' onClick={handleModalSaveButtonClick}>Accept</button>
                    <button type='button' className='btn btn-Secondary' onClick={handleModalCancelClose}>Cancel</button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default FoodJournal;
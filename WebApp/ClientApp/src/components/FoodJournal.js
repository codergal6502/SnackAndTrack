import { useEffect, useState } from 'react';
import React, { Component } from 'react';
import Select from 'react-select';
import { useSearchParams } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import ModalHeader from 'react-bootstrap/esm/ModalHeader';

const FoodJournal = () => {
    // make it so users can bookmark and navigate
    const [searchParams, setSearchParams] = useSearchParams();

    // backing objects
    const [calendarState, setCalendarState] = useState({})
    const [foodItemPopupState, setFoodItemPopupState] = useState({ visible: false, foodItemId: '', unitId: '', quantity: '', foodItemOptions: [ ], selectedFoodItemOption: null, unitOptions: [ ], selectedUnitOption: null })

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
            setFoodItemPopupState(newFoodItemPopupState);
        }
        else {
            const newFoodItemPopupState = {... foodItemPopupState, selectedFoodItemOption: null, unitOptions: null };
            setFoodItemPopupState(newFoodItemPopupState);
        }
    }

    const handleFoodItemUnitChange = (selectedOption) => {
        const newFoodItemPopupState = {... foodItemPopupState, selectedUnitOption: selectedOption };
        setFoodItemPopupState(newFoodItemPopupState);
    }

    const handleFoodItemQuantityChange = (quantity) => {
        const newFoodItemPopupState = {... foodItemPopupState, quantity: quantity };
        setFoodItemPopupState(newFoodItemPopupState);
    }

    const editFoodOnClick = (e) => {
        setFoodItemPopupState({...foodItemPopupState, visible: true});
    }
    
    const handleModalClose = (e) => {
        setFoodItemPopupState({...foodItemPopupState, visible: false});
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
                    <tr>
                        <td>
                            <div className='input-group'>
                                <input readOnly defaultValue="Chickpea Scramble (Unsalted), 1 Serving" className='form-control' />
                                <button className='btn btn-secondary' onClick={editFoodOnClick}><i className="bi bi-pencil-square"></i></button>
                            </div>
                        </td>
                        {calendarState.nutrientTargets?.map((nt, idx) => <td scope="col" key={idx} style={{width: `${(2 + calendarState.nutrientTargets?.count) * 100}%`}}>{0}</td>)}
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <th>Total</th>
                    </tr>
                </tfoot>
            </table>

            <Modal show={foodItemPopupState.visible} onHide={handleModalClose} centered>
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
                            className={`${foodItemPopupState["-show-errors"] && foodItemPopupState["-error-foodItemId"] ? 'is-invalid' : ''}`}
                        />
                        <label htmlFor="unitSelect" className='form-label'>Unit:</label>
                        <Select
                            id="unitSelect"
                            options={foodItemPopupState?.unitOptions ?? []}
                            isClearable
                            onChange={(selectedOption) => { handleFoodItemUnitChange(selectedOption) }}
                            value={foodItemPopupState.selectedUnitOption}
                            classNamePrefix="react-select"
                            className={`${foodItemPopupState["-show-errors"] && foodItemPopupState["-error-unitId"] ? 'is-invalid' : ''}`}
                            placeholder="unit"
                        />
                        {(foodItemPopupState["-show-errors"] && (<div className='error-message'>{foodItemPopupState["-error-unitId"]}</div>))}
                        <label htmlFor="quantity" className='form-label'>Quantity</label>
                        <input
                            id="quantity"
                            type="number"
                            onChange={(e) => { handleFoodItemQuantityChange(e.target.value) }}
                            value={foodItemPopupState.quantity}
                            className={`form-control ${(foodItemPopupState["-show-errors"] && foodItemPopupState["-error-quantity"]) ? "is-invalid" : ""}`}
                            placeholder={foodItemPopupState?.selectedUnitOption?.unit?.name}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button type='button' className='btn btn-primary' onClick={handleModalClose}>Save</button>
                    <button type='button' className='btn btn-Secondary' onClick={handleModalClose}>Cancel</button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default FoodJournal;
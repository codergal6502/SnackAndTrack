import { useEffect, useState } from 'react';
import Select from 'react-select';
import { useSearchParams } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import { DateTime} from "luxon";

const FoodJournal = () => {
    // make it so users can bookmark and navigate
    const [searchParams, setSearchParams] = useSearchParams();

    const defaultPopupState = { visible: false, quantity: '', journalEntryId: '', foodItemOptions: [ ], selectedFoodItemOption: null, unitOptions: [ ], selectedUnitOption: null, "-show-errors": false };
    const defaultJournalEntry = { foodItem: null, unit: null, quantity: null, time: null, nutrients: { } };

    // backing objects
    const [journalState, setJournalState] = useState({ date: "", goalNutrientIds: [ ], journalEntries: [ {... defaultJournalEntry } ] })
    const [foodItemPopupState, setFoodItemPopupState] = useState({... defaultPopupState })

    const doSetJournalState = (x) => { /*debugger;*/ setJournalState(x); }

    // lookups and select options
    const [unitDictionary, setUnitDictionary] = useState(null);
    const [unitOptions, setUnitOptions] = useState([]); // Empty 2D-array

    const [nutritionGoalSetDictionary, setNutritionGoalSetDictionary] = useState();
    const [nutritionGoalSetOptions, setNutritionGoalSetOptions] = useState(null);

    useEffect(() => {
        fetchAndSetNutritionalGoalSets();
        fetchAndSetUnits();
    }, []);

    useEffect(() => {
        const loadEntries = async () => {
            if (unitDictionary && nutritionGoalSetDictionary && nutritionGoalSetOptions && searchParams) {
                const searchParamsJsObject = convertSearchParamsToJsObjct(searchParams);
                const newJournalState = generateJournalStateUsingSearchParams({ ...journalState }, searchParamsJsObject);
                const foodJournalEntries = await fetchFoodJournalEntries(newJournalState.date);

                newJournalState.journalEntries = [ ];

                for (const foodJournalEntry of foodJournalEntries) {
                    const journalEntry = {
                        journalEntryId: foodJournalEntry.id
                      , foodItem: foodJournalEntry.foodItem
                      , unit: foodJournalEntry.unit
                      , quantity: foodJournalEntry.quantity
                      , time: foodJournalEntry.time
                      , "-dt-object": DateTime.fromISO(foodJournalEntry.time)
                      , nutrients: { }
                    };

                    populateJournalEntryNutrients(journalEntry, newJournalState.nutrientTargets, journalEntry.foodItem);
                    newJournalState.journalEntries.push(journalEntry);
                }

                newJournalState.journalEntries.push({...defaultJournalEntry});

                doSetJournalState(newJournalState);
            }
        };

        loadEntries();
    }, [searchParams, nutritionGoalSetDictionary, nutritionGoalSetOptions, unitDictionary])

    const fetchAndSetUnits = async () => {
        const query =  `
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
      id
      ratio
      toUnit
      {
        id
        name
      }
    }
  }
}`;
        
        try {
            const body=JSON.stringify({query});
            const response = await fetch('/graphql/query', {
                method: 'POST'
              , headers: {
                    'Content-Type': 'application/json'
                }
              , body: body
            });
            
            const { data } = await response.json();
            if (!response.ok) {
                throw new Error(`GraphQL reponse status is ${response.status}.`);
            }

            const units = data.units;

            const newUnitDct = units.reduce((result, unit) => { result[unit.id] = unit; return result; }, {});
            setUnitDictionary(newUnitDct);

            const groupedUnitDictionary = Object.groupBy(units.filter(u => u.canBeFoodQuantity), u => u.type);
            const unitTypes = Object.keys(groupedUnitDictionary).toSorted((t1, t2) => t1.localeCompare(t2))
            const groupedOptions =
                unitTypes
                    .map(unitType => ({
                        label: unitType
                      , options: groupedUnitDictionary[unitType].toSorted((u1, u2) => u1.name.localeCompare(u2.name)).map(unit => ({
                            value: unit.id
                          , label: unit.name
                          , unit: unit
                        }))
                    }));

            setUnitOptions(groupedOptions);
        }
        catch (error) {
            console.error(`Request to GraphQL failed.`, error)
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
          id
          name
          group
        }
        quantity
        unit {
          id
          name
          type
        }
      }
      servingSizes {
        quantity
        unit {
          id
          name
          type
          abbreviationCsv
        }
      }
    }
  }
}`;

        const body = JSON.stringify({query, variables: { qName }});
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

    const fetchFoodJournalEntries = async (date) => {
        const query = `
query GetFoodJournalEntries($date: DateOnly) {
  foodJournalEntries(
    date: $date
    page: 1
    pageSize: 999
    sortOrder: ASCENDING
    sortBy: TIME
  ) {
    totalCount
    totalPages
    items {
      id
      date
      time
      quantity
      foodItem {
        id
        name
        foodItemNutrients {
          quantity
          nutrient {
            id
            name
            group
          }
          unit {
            id
            name
            type
          }
        }
        servingSizes {
          quantity
          unit {
            id
            name
            type
            abbreviationCsv
          }
        }
      }
      unit {
        id
        name
        type
      }
    }
  }
}
        `;

        const body = JSON.stringify({query, variables: { date }});
        const response = await fetch('/graphql/query', {
            method: 'POST'
          , headers: {
                'Content-Type': 'application/json'
            }
          , body: body
        });
        
        const { data } = await response.json();

        return data.foodJournalEntries.items;
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

    const handleFoodItemTimeChange = (time) => {
        const dt = DateTime.fromISO(time);
        console.log(dt);
        const newFoodItemPopupState = {... foodItemPopupState, time: time, "-dt-object]": dt };
        populateErrorsInFoodItemPopup(newFoodItemPopupState);
        setFoodItemPopupState(newFoodItemPopupState);
    }

    const editFoodOnClick = (index) => {
        const journalEntry = journalState.journalEntries[index];
        setFoodItemPopupState({
            ...defaultPopupState
          , visible: true
          , journalEntryId: journalEntry.journalEntryId
          , journalEntryIndex: index
          , selectedFoodItemOption: ! journalEntry.foodItem ? null : { label: journalEntry.foodItem.name, value: journalEntry.foodItem.id, foodItem: journalEntry.foodItem }
          , selectedUnitOption: ! journalEntry.unit ? null : { label: journalEntry.unit.name, value: journalEntry.unit.id, unit: journalEntry.unit }
          , quantity: journalEntry.quantity
          , time: journalEntry.time
        });
    }
    
    const handleModalOpen = () => {
        setFoodItemPopupState({...foodItemPopupState, "-show-errors": false})
    }

    const handleModalCancelClose = (e) => {
        setFoodItemPopupState({...foodItemPopupState, visible: false});
    }

    
    const populateJournalEntryNutrients = (newJournalEntry, nutrientTargets, foodItem) => {
        for (const nutrientTarget of nutrientTargets) {
            const fi = foodItem;
            const fin = fi.foodItemNutrients.filter(fin => fin.nutrient.id == nutrientTarget.nutrientId)[0];
            const s = fi.servingSizes.filter(s => s.unit.type == newJournalEntry.unit.type)[0];
            
            if (!s) {
                // TODO: log error somehow!
            }
            else if (fin) {
                // A little dimensional analysis. We have food item quantity. We want nutrient quantity.
                
                // jFiQ is the food item quantity in the journal
                // jFiU is the food item unit in the journal
                // sFiU is the food item unit in the serving
                // sFiQ is the food item quantity per serving
                // sNQ  is the nutrient quantity per serving
                // sNU  is the nutrient unit in the serving
                // jNU  is the nutrient unit in the journal
                const jFiQ  = newJournalEntry.quantity;
                const jFiU  = newJournalEntry.unit.id;
                const sFiU  = s.unit.id;
                const sFiQ  = s.quantity;
                const sNQ   = fin.quantity;
                const sNU   = fin.unit.id;
                const jNU   = nutrientTarget.unitId;

                // jFiQ (jFiU)   (sFiU)       1         sNQ (sNU)   (jNU)
                // ----------- • ------ • ----------- • --------- • -----
                //               (jFiU)   sFiQ (sFiU)               (sNU)
                //                 A          A            A           A          
                //                 |          |            |           
                //                 |          |            nutrient logged
                //                 |          number of servings
                //                 probably 1
                
                let sjFiURatio;
                if(jFiU == sFiU) {
                    sjFiURatio = 1;
                }
                else {
                    let fromUnit = unitDictionary[jFiU];
                    let conversion = fromUnit.fromUnitConversions.filter(c => c.toUnit.id == sFiU)[0];
                    sjFiURatio = conversion.ratio;
                };

                let jsNURatio;
                if (jNU == sNU) {
                    jsNURatio = 1;
                }
                else {
                    jsNURatio = 1;
                    let fromUnit = unitDictionary[sNU];
                    let conversion = fromUnit.fromUnitConversions.filter(c => c.toUnit.id == jNU)[0];
                    jsNURatio = conversion.ratio;
                }

                let nutrientToJournal = jFiQ;
                nutrientToJournal *= sjFiURatio;
                nutrientToJournal /= sFiQ;
                nutrientToJournal *= sNQ;
                nutrientToJournal *= jsNURatio;

                newJournalEntry.nutrients[nutrientTarget.nutrientId] = nutrientToJournal;
            }
            else {
                newJournalEntry.nutrients[nutrientTarget.nutrientId] = 0;
            }
        }
    }
    
    const handleModalSaveButtonClick = async (e) => {
        let newFoodItemPopupState = {...foodItemPopupState, "-show-errors": true};
        if (populateErrorsInFoodItemPopup(newFoodItemPopupState)) {
            setFoodItemPopupState(newFoodItemPopupState);
        }
        else {
            const newJournalEntry = {
                foodItem: foodItemPopupState.selectedFoodItemOption.foodItem
              , unit: foodItemPopupState.selectedUnitOption.unit
              , quantity: foodItemPopupState.quantity
              , time: foodItemPopupState.time
              , date: journalState.date
              , nutrients: { }
            }

            const postPutObject = {
                id: foodItemPopupState.journalEntryId
              , foodItemId: newJournalEntry.foodItem.id
              , unitId: newJournalEntry.unit.id
              , quantity: newJournalEntry.quantity
              , time: newJournalEntry.time
              , date: newJournalEntry.date
            };

            /** @type Response */ let response;
            let responseOk;
            let journalEntryId = null;
            if (foodItemPopupState.journalEntryId) {
                response = await fetch(
                    `/api/journalentries/${foodItemPopupState.journalEntryId}`
                  , {
                        method: 'PUT'
                      , headers: { 'Content-Type': 'application/json' }
                      , body: JSON.stringify(postPutObject)
                    }
                );
                responseOk = response.ok;
                if (responseOk) {
                    journalEntryId = foodItemPopupState.journalEntryId;
                }
            }
            else {
                response = await fetch(
                    `/api/journalentries/`
                  , {
                        method: 'POST'
                      , headers: { 'Content-Type': 'application/json' }
                      , body: JSON.stringify(postPutObject)
                    }
                );
                responseOk = response.ok;
                if (responseOk) {
                    journalEntryId = (await response.json()).id;
                }
            }

            newJournalEntry.journalEntryId = journalEntryId;

            if (response.ok) {
                populateJournalEntryNutrients(newJournalEntry, journalState.nutrientTargets, foodItemPopupState.selectedFoodItemOption.foodItem);

                console.log(newJournalEntry);

                const addEmptyJournalEntry = foodItemPopupState.journalEntryIndex == journalState.journalEntries.length - 1;

                const newJournalEntries = addEmptyJournalEntry ?  [...journalState.journalEntries, {...defaultJournalEntry}] : [...journalState.journalEntries];
                newJournalEntries[foodItemPopupState.journalEntryIndex] = newJournalEntry;
                const newCalendarState = { ...journalState, journalEntries: newJournalEntries };
                console.log(newCalendarState);
                doSetJournalState(newCalendarState);
                setFoodItemPopupState({... defaultPopupState });
            }
        }
    }

    const handleModalDeleteButtonClick = async (e) => {
        if (foodItemPopupState.journalEntryId) {
            const response = await fetch(
                `/api/journalentries/${foodItemPopupState.journalEntryId}`
              , {
                    method: 'DELETE'
                  , headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.ok) {
                const journalEntries = journalState.journalEntries.filter((_, index) => foodItemPopupState.journalEntryIndex != index)
                doSetJournalState({... journalState, journalEntries: journalEntries });
            }
            else {
                // TODO: log somehow?
            }
        }
        setFoodItemPopupState({...foodItemPopupState, visible: false});
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
        const parsedQuantity = parseFloat(newFoodItemPopupState.quantity);
        
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

    const generateJournalState = (journalState, date, goalNutrientIds) => {
        if (isNaN(date)) { date = new Date().toISOString().split('T')[0]; }
        else { date = new Date(date).toISOString().split('T')[0]; }

        goalNutrientIds = goalNutrientIds ?? [ ];
        let nutrientTargets = [ ];

        for (const ngsId of goalNutrientIds) {
            let nutritionGoal = nutritionGoalSetDictionary[ngsId];

            if (new Date(nutritionGoal.endDate) < new Date(date) || new Date(date) < new Date(nutritionGoal.startDate)) {
                continue;
            }

            const nutritionGoalStartDate = new Date(nutritionGoal.startDate);
            const dayDifferce = Math.ceil((new Date(date) - nutritionGoalStartDate) / (1000 * 60 * 60 * 24));

            for (const nutrient of nutritionGoal.nutrients) {
                const nutrientTarget = {
                    nutrientName: nutrient.nutrient.name
                  , nutrientId: nutrient.nutrient.id
                  , unitId: nutrient.nutrient.defaultUnit.id
                  , unitName: nutrient.nutrient.defaultUnit.name
                  , date: date
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

        journalState = {... journalState, date: date, nutrientTargets: nutrientTargets, goalNutrientIds: goalNutrientIds };

        return journalState;
    }

    const generateJournalStateUsingSearchParams = (journalState, searchParamsJsObject) => {
        return generateJournalState(journalState, new Date(searchParamsJsObject.date), searchParamsJsObject.nutritionGoals);
    }

    const convertSearchParamsToJsObjct = (/** @type {URLSearchParams} */ searchParams) => {
        let oldSearchParamsAsJsObject = {};
        
        for (const key of Array.from(searchParams.keys())) {
            oldSearchParamsAsJsObject = { ... oldSearchParamsAsJsObject, [key]: searchParams.getAll(key) };
        }
        return oldSearchParamsAsJsObject;
    }

    const handleDateChange = (newDate) => {
        // Search Parameter
        let oldSearchParamsAsJsObject = convertSearchParamsToJsObjct(searchParams);        
        const newSearchParams = { ...oldSearchParamsAsJsObject, date: newDate };
        setSearchParams(newSearchParams);

        // Journal State
        const newJournalState = generateJournalState({ ...journalState }, newDate, oldSearchParamsAsJsObject.nutritionGoals );
        doSetJournalState(newJournalState);
    }

    const handleGoalChange = (selectedOptions) => {
        // Search Parameter
        let oldSearchParamsAsJsObject = convertSearchParamsToJsObjct(searchParams);        
        const goalIds = selectedOptions.map(so => so.value);
        const newSearchParams = { ...oldSearchParamsAsJsObject, nutritionGoals: goalIds };
        setSearchParams(newSearchParams);

        // Journal State
        const newJournalState = generateJournalState({ ...journalState }, oldSearchParamsAsJsObject.date, goalIds );
        doSetJournalState(newJournalState);
    }

    const fetchAndSetNutritionalGoalSets = async () => {
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
          id
          name
          defaultUnit {
            id
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
                    <label htmlFor="date" className="form-label">Start Date:</label>
                    <input type="date" id="date" name="date" className='form-control' onChange={e => handleDateChange(e.target.value)} value={journalState.date} />
                </div>
                <div className="me-3">
                    <label htmlFor="showGoals" className="form-label">Show Nutrition Goals:</label>
                    <Select
                        options={nutritionGoalSetOptions}
                        isMulti={true}
                        isClearable={false}
                        onChange={s => handleGoalChange(s)}
                        value={nutritionGoalSetOptions?.filter(opt => (journalState.goalNutrientIds ?? []).indexOf(opt.value) >= 0)}
                    />
                </div>
            </div>
            
            <table className='table table-striped table-bordered'>
                <thead>
                    <tr>
                        <th scope='row'>Nutrient</th>
                        {journalState.nutrientTargets?.map((nt, idx) => <th scope="col" key={idx} style={{width: `${(2 + journalState.nutrientTargets?.count) * 100}%`}}>{nt.nutrientName}</th>)}
                    </tr>
                    <tr>
                        <th scope='row'>Target</th>
                        {journalState.nutrientTargets?.map((nt, idx) => <th scope="col" key={idx}>{nt.target?.minimum}-{nt.target.maximum} {nt.unitName}</th>)}
                    </tr>
                    <tr>
                        <th>Total</th>
                        {journalState.nutrientTargets?.map((nt, targetIndex) =>
                            <td scope="col" key={targetIndex} style={{width: `${(2 + journalState.nutrientTargets?.count) * 100}%`}}>{Math.round(journalState.journalEntries.map(je => je.nutrients[nt.nutrientId]).reduce((prev, curr) => prev + (curr ?? 0), 0))}</td>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {journalState.journalEntries.map((je, entryIndex) => 
                        <tr key={entryIndex}>
                            <td>
                                <div className="position-relative">
                                    <label readOnly className='form-label'>{je.foodItem && je.unit && je.quantity ? `${je.foodItem.name}, ${je.quantity} ${je.unit.name} ${je["-dt-object"]?.invalid ? "" : je["-dt-object"].toLocaleString(DateTime.TIME_SIMPLE)}` : ''}</label>
                                    <button className='btn btn-secondary position-absolute end-0 top-50 translate-middle-y' onClick={() => editFoodOnClick(entryIndex)}><i className="bi bi-pencil-square"></i></button>
                                </div>
                            </td>
                            {journalState.nutrientTargets?.map((nt, targetIndex) =>
                                <td scope="col" key={targetIndex} style={{width: `${(2 + journalState.nutrientTargets?.count) * 100}%`}}>{isNaN(je.nutrients[nt.nutrientId]) ? "" : Math.round(je.nutrients[nt.nutrientId])}</td>
                            )}
                        </tr>
                    )}
                </tbody>
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
                            value={foodItemPopupState.quantity ?? ""}
                            className={`form-control ${(foodItemPopupState["-show-errors"] && foodItemPopupState["-error-quantity"]) ? "is-invalid" : ""}`}
                            placeholder={foodItemPopupState?.selectedUnitOption?.unit?.name}
                        />
                        {(foodItemPopupState["-show-errors"] && (<div className='error-message'>{foodItemPopupState["-error-quantity"]}</div>))}
                        <label htmlFor="time" className='form-label'>Time</label>
                        <input
                            id="time"
                            type="time"
                            onChange={(e) => { handleFoodItemTimeChange(e.target.value) }}
                            value={foodItemPopupState.time ?? ""}
                            className={`form-control ${(foodItemPopupState["-show-errors"] && foodItemPopupState["-error-time"]) ? "is-invalid" : ""}`}
                            placeholder={foodItemPopupState?.selectedUnitOption?.unit?.name}
                        />
                        {(foodItemPopupState["-show-errors"] && (<div className='error-message'>{foodItemPopupState["-error-time"]}</div>))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button type='button' className='btn btn-primary' onClick={e => { handleModalSaveButtonClick(); }}>Save</button>
                    <button type='button' className='btn btn-danger' onClick={e => { handleModalDeleteButtonClick(); }}>Delete</button>
                    <button type='button' className='btn btn-secondary' onClick={e => { handleModalCancelClose(); }}>Cancel</button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default FoodJournal;
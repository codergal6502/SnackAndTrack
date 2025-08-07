import { useEffect, useState } from 'react';
import { json, Link } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';

const NutritionGoalSetForm = () => {
    const [nutritionGoalSet, setNutritionGoalSet] = useState({ name: "", startDate: "", endDate: "", period: null, dayModes: [], nutrients: [] })
    const [nutrientOptions, setNutrientOptions] = useState([]);
    const [nutrientDictionary, setNutrientDictionary] = useState({});

    const { id } = useParams();
    const navigate = useNavigate();
    
    useEffect(() => {
        fetchNutrients();
    }, []);

    useEffect(() => {
        if (Object.keys(nutrientDictionary).length > 0 && id) {
            fetchNutritionGoalSet(id);
        }
    }, [nutrientDictionary, id])

    const validateAndSetNutritionGoalSet = (nutritionGoalSet, showErrors) => {
        const newNutritionGoalSet = { ... nutritionGoalSet, "-show-errors": showErrors || nutritionGoalSet["-show-errors"] };
        validateNutritionGoalSet(newNutritionGoalSet);
        
        setNutritionGoalSet(newNutritionGoalSet);
        return newNutritionGoalSet["-has-errors"];
    }

    const validateNutritionGoalSet = (newNutritionGoalSet) => {
        let hasErrors = false;

        // the elegant, graceful-looking ||= won't work because of short-circuit evaluation.
        hasErrors = validateName(newNutritionGoalSet) || hasErrors;
        hasErrors = validateSchedule(newNutritionGoalSet) || hasErrors;
        hasErrors = validateNutrients(newNutritionGoalSet) || hasErrors;

        newNutritionGoalSet["-has-errors"] = hasErrors;

        return hasErrors;
    };

    const validateName = (newNutritionGoalSet) => {
        let hasErrors = false;

        if (! (newNutritionGoalSet.name || "").trim()) {
            newNutritionGoalSet["-error-name"] = "Goal set name is required.";
            hasErrors = true;
        }
        else {
            delete newNutritionGoalSet["-error-name"];
        }

        setNutritionGoalSet(newNutritionGoalSet);
        newNutritionGoalSet["-has-errors"] = hasErrors;

        return hasErrors;
    };

    const validateSchedule = (newNutritionGoalSet) => {
        let hasErrors = false;

        const startIsNull = ! newNutritionGoalSet.startDate?.trim();
        const endIsNull = ! newNutritionGoalSet.endDate?.trim();
        const parsedStart = Date.parse(newNutritionGoalSet.startDate);
        const parsedEnd = Date.parse(newNutritionGoalSet.endDate);

        delete newNutritionGoalSet["-error-start-date"];
        delete newNutritionGoalSet["-error-end-date"];

        if (!endIsNull && isNaN(parsedEnd)) {
            // Probably impossible
            newNutritionGoalSet["-error-end-date"] = "Start end must be a valid date.";
            hasErrors = true;
        }

        if (startIsNull) {
            newNutritionGoalSet["-error-start-date"] = "You must always specify a start date.";
            hasErrors = true;
        }
        else if (isNaN(parsedStart)) {
            // Probably impossible
            newNutritionGoalSet["-error-start-date"] = "Start date must be a valid date.";
            hasErrors = true;
        }
        else if (!endIsNull && !isNaN(parsedEnd)) {
            // Implied neither is null.
            if (parsedStart > parsedEnd) {
                newNutritionGoalSet["-error-start-date"] = "Start date must be before end date.";
                newNutritionGoalSet["-error-end-date"] = "End date must be after start date.";
                hasErrors = true;
            }
        }

        const periodIsNull = null === newNutritionGoalSet.period;
        const parsedPeriod = parseInt(newNutritionGoalSet.period);

        delete newNutritionGoalSet["-error-period"];
        
        if (periodIsNull) {
            newNutritionGoalSet["-error-period"] = "You must specify a period for the goal."
            hasErrors = true;
        }
        else if (isNaN(parsedPeriod)) {
            newNutritionGoalSet["-error-period"] = "Period for the goal must be a number."
            hasErrors = true;
        }
        else if (31 < parsedPeriod || parsedPeriod < 0) {
            newNutritionGoalSet["-error-period"] = "Period must be between 1 and 31, inclusive."
            hasErrors = true;
        }

        return hasErrors;
    }

    const validateNutrients = (newNutritionGoalSet) => {
        let hasErrors = false

        for (let nutrient of newNutritionGoalSet.nutrients) {
            if (! nutrient?.nutrientId) {
                nutrient["-error-nutrientId"] = "You must specify a nutrient";
                hasErrors = true;
            }
            else {
                delete nutrient["-error-nutrientId"];
            }

            for (let target of Object.values(nutrient.targets)) {
                hasErrors = validateTarget(target) || hasErrors;
            }
        }

        return hasErrors;
    }

    const validateTarget = (target) => {
        let hasErrors = false;

        // This ternary papers over React not liking nulls in inputs and
        // .NET returning numbers which in JavaScript don't have .trim().
        const minIsNull = ! target.minimum?.toString()?.trim();
        const maxIsNull = ! target.maximum?.toString()?.trim();
        const parsedMin = parseInt(target.minimum);
        const parsedMax = parseInt(target.maximum);

        delete target["-error-minimum"];
        delete target["-error-maximum"];

        // Same pattern as with the dates.
        if (minIsNull && maxIsNull) {
            target["-error-minimum"] = "You must specify minimum, a maximum, or both.";
            target["-error-maximum"] = "You must specify minimum, a maximum, or both.";

            hasErrors = true;
        }
        else if (maxIsNull) {
            // implied min isn't null.
            if (isNaN(parsedMin)) {
                // Probably impossible
                target["-error-minimum"] = "Minimum must be valid number.";
                hasErrors = true;
            }
            else if (0 > parsedMin) {
                target["-error-minimum"] = "Minimum must be a postive number.";    
                hasErrors = true;
            }
        }
        else if (minIsNull) {
            // implied max isn't null.
            if (isNaN(parsedMax)) {
                // Probably impossible
                target["-error-maximum"] = "Maximum must be a valid number.";
                hasErrors = true;
            }
            else if (0 > parsedMax) {
                target["-error-maximum"] = "Maximum must be a postive number.";    
                hasErrors = true;
            }
        }
        else {
            // Implied neither is null.
            if (parsedMin > parsedMax) {
                target["-error-minimum"] = "Minimum must be less than maximum.";
                target["-error-maximum"] = "Maximum must be greater than minimum.";
                hasErrors = true;
            }
            else {
                if (0 > parsedMin) {
                    target["-error-minimum"] = "Minimum must be a postive number.";    
                    hasErrors = true;
                }
                if (0 > parsedMax) {
                    target["-error-maximum"] = "Maximum must be a postive number.";    
                    hasErrors = true;
                }
            }
        }

        return hasErrors;
    }

    const fetchNutritionGoalSet = async (id) => {
        const response = await fetch(`/api/nutritiongoalsets/${id}`);
        const data = await response.json();
        setNutritionGoalSet(data);
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        // todo: rename validate* to populateErrorsIn*
        validateNutritionGoalSet({ ...nutritionGoalSet, [name]: value });
    };

    const rebuildNutrientTargets = (newNutrients, newDayModes) => {
        const targetTemplates = buildTargetTemplatesFromDayModes(newDayModes);

        for (const newNutrient of newNutrients) {
            const oldTargets = newNutrient?.targets;
            newNutrient.targets = { };
            for (const startDay of Object.keys(targetTemplates)) {
                const targetTemplate = targetTemplates[startDay];
                const newTarget = oldTargets?.[startDay] ?? { minimum: "", maximum: ""};
                newTarget.start = targetTemplate.start; // should always match startDay, but this one's already an int
                newTarget.end = targetTemplate.end;
                newNutrient.targets[startDay] = newTarget;
            }
        }

        return newNutrients;
    }

    const handlePeriodChange = async (selectedElement) => {
        const newPeriod = parseInt(selectedElement.value);

        const newDayModes = [ ];

        for (let i = 0; i < newPeriod; i++) { newDayModes[i] = nutritionGoalSet.dayModes[i] || { type: "DifferentGoal" }; }

        const newNutrients = rebuildNutrientTargets([...nutritionGoalSet.nutrients], newDayModes);

        validateNutritionGoalSet({... nutritionGoalSet, period: newPeriod, dayModes: newDayModes, nutrients: newNutrients});
    };

    const addNutrient = async() => {
        const newNutrients = [... nutritionGoalSet.nutrients, { nutrientId: null, targets: { } }];
        const newNutritionGoalSet = {... nutritionGoalSet, nutrients: newNutrients };
        validateAndSetNutritionGoalSet(newNutritionGoalSet);
    }

    const removeNutrient = (index) => {
        const nutrients = nutritionGoalSet.nutrients.filter((_, i) => i !== index);
        validateAndSetNutritionGoalSet({ ...nutritionGoalSet, nutrients: nutrients });
    };

    const moveNutrientUp = (index) => {
        if (index > 0) {
            const nutrientsBefore = nutritionGoalSet.nutrients.slice(0, index - 1);
            const nutrientsAfter  = nutritionGoalSet.nutrients.slice(index + 1);
            const newNutrients = [...nutrientsBefore, nutritionGoalSet.nutrients[index], nutritionGoalSet.nutrients[index - 1], ...nutrientsAfter];
            validateAndSetNutritionGoalSet({ ...nutritionGoalSet, nutrients: newNutrients});
        }
    }

    const moveNutrientDown = (index) => {
        if (index < nutritionGoalSet.nutrients.length - 1) {
            const nutrientsBefore = nutritionGoalSet.nutrients.slice(0, index);
            const nutrientsAfter  = nutritionGoalSet.nutrients.slice(index + 2);
            const nutrients = [...nutrientsBefore, nutritionGoalSet.nutrients[index + 1], nutritionGoalSet.nutrients[index], ...nutrientsAfter];
            validateAndSetNutritionGoalSet({ ...nutritionGoalSet, nutrients: nutrients});
        }
    }

    const handleNutrientSelectionChange = async(index, selectedElement) => {
        let newNutrients = [... nutritionGoalSet.nutrients ];
        newNutrients[index] = { nutrientId: selectedElement.value, targets: { } };

        newNutrients = rebuildNutrientTargets(newNutrients, nutritionGoalSet.dayModes);

        const newNutritionGoalSet = {... nutritionGoalSet, nutrients: newNutrients };
        
        validateAndSetNutritionGoalSet(newNutritionGoalSet);
    }

    const handleDayModeChange = async(index, selectedElement) => {
        const newDayModes = [... nutritionGoalSet.dayModes];
        newDayModes[0] = { type: "DifferentGoal" };
        newDayModes[index + 1] = { type: selectedElement.value };

        const newNutrients = rebuildNutrientTargets([... nutritionGoalSet.nutrients], newDayModes);

        const newNutritionGoalSet = {...nutritionGoalSet, dayModes: newDayModes, nutrients: newNutrients};

        validateAndSetNutritionGoalSet(newNutritionGoalSet);
    }

    const buildTargetTemplatesFromDayModes = (dayModes) => ({ ... dayModes.reduce((accumulatorArray, dayMode, dayNumber)=> {
        // What is going on this this syntax?
        // => ({ })     we want an object but the curly braces are interpreted
        //              as function body without the outer parenthsis
        //
        // { ... someArray}   converts the array, which is sparse, to an object
        if ("DifferentGoal" == dayMode.type) {
            let newRange = { start: dayNumber, end: dayNumber };
            accumulatorArray[dayNumber] = newRange;
        }
        else {
            accumulatorArray[accumulatorArray.length - 1].end = dayNumber;
        }

        return accumulatorArray;
    }, [ ])});


    const handleTargetMinimumChange = async (nutrientIndex, startDay, value) => {
        const newNutrients = [... nutritionGoalSet.nutrients];
        const newTargets = {... newNutrients[nutrientIndex].targets};

        newTargets[startDay] = {... newTargets[startDay], minimum: value };
        newNutrients[nutrientIndex] = {... newNutrients[nutrientIndex], targets: newTargets}

        const newNutritionGoalSet = {... nutritionGoalSet, nutrients: newNutrients};

        validateAndSetNutritionGoalSet(newNutritionGoalSet);
    }

    const handleTargetMaximumChange = async (nutrientIndex, startDay, value) => {
        const newNutrients = [... nutritionGoalSet.nutrients];
        const newTargets = {... newNutrients[nutrientIndex].targets};

        newTargets[startDay] = {... newTargets[startDay], maximum: value };
        newNutrients[nutrientIndex] = {... newNutrients[nutrientIndex], targets: newTargets}

        const newNutritionGoalSet = {... nutritionGoalSet, nutrients: newNutrients};

        validateAndSetNutritionGoalSet(newNutritionGoalSet);
    }

    const fetchNutrients = async() => {
        let url = `/api/lookup/nutrients`
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Request to ${url} reponse status is ${response.status}.`);
            }

            const nutrientArray = await response.json();
            const nutrientGroupDictionary = Object.groupBy(nutrientArray, n => n.group);
            const groupedOptions = Object.keys(nutrientGroupDictionary).map(k => ({
                label: k
              , displayOrder: Math.min.apply(null, nutrientGroupDictionary[k].map(nutrient => nutrient.displayOrder))
              , options: nutrientGroupDictionary[k].toSorted((n1, n2) => n1.displayOrder - n2.displayOrder).map(nutrient => ({
                    value: nutrient.id
                  , label: nutrient.name
                }))
            })).toSorted((n1, n2) => n1.displayOrder - n2.displayOrder);

            setNutrientOptions(groupedOptions);
            setNutrientDictionary(nutrientArray.reduce((result, nutrient) => { result[nutrient.id] = nutrient; return result; }, { }));
        }
        catch (error) {
            console.error(`Request to ${url} failed.`, error)
            setNutrientOptions([]);
        }
    }

    const canShowTargets = () => {
        // If any day mode is not set, we can't render.
        for (const dayMode of nutritionGoalSet.dayModes) {
            if (! dayMode?.type) {
                return false;
            }
        }

        // If all day modes are set and there's at least one set nutrient,
        // we can render.
        for (const nutrient of nutritionGoalSet.nutrients) {
            if (nutrient.nutrientId) {
                return true;
            }
        }

        // If no nutrients are set, we cannot render.
        return false;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hasErrors = validateAndSetNutritionGoalSet(nutritionGoalSet, true);

        if (!hasErrors) {
            /** @type {Response} */ let response;
            if (id) {
                response = await fetch(`/api/nutritiongoalsets/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(nutritionGoalSet),
                });
            } else {
                response = await fetch('/api/nutritiongoalsets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(nutritionGoalSet),
                });
            }

            if (response.ok) {
                navigate('/nutritionGoalSetList');
            }
        }
    };


    return (
        <form autoComplete="Off" onSubmit={handleSubmit}>
            <div>
                <h1>Nutrition Goal Set</h1>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name:</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={nutritionGoalSet.name}
                        className={`form-control ${(nutritionGoalSet["-show-errors"] && nutritionGoalSet["-error-name"]) ? "is-invalid" : ""}`}
                        onChange={handleChange}
                    />
                    {(nutritionGoalSet["-show-errors"] && (<div className='error-message'>{nutritionGoalSet["-error-name"]}</div>))}
                </div>
                <h2>Schedule</h2>
                <div className="mb-3">
                    <label htmlFor="start-date" className="form-label">Start Date:</label>
                    <input
                        id="start-date"
                        name="startDate"
                        type='date'
                        value={nutritionGoalSet.startDate}
                        className={`form-control ${(nutritionGoalSet["-show-errors"] && nutritionGoalSet["-error-start-date"]) ? "is-invalid" : ""}`}
                        onChange={handleChange}
                    />
                    {(nutritionGoalSet["-show-errors"] && (<div className='error-message'>{nutritionGoalSet["-error-start-date"]}</div>))}
                </div>
                <div className="mb-3">
                    <label htmlFor="end-date" className="form-label">End Date:</label>
                    <input
                        id="end-date"
                        name="endDate"
                        type='date'
                        value={nutritionGoalSet.endDate}
                        className={`form-control ${(nutritionGoalSet["-show-errors"] && nutritionGoalSet["-error-end-date"]) ? "is-invalid" : ""}`}
                        onChange={handleChange}
                    />
                    {(nutritionGoalSet["-show-errors"] && (<div className='error-message'>{nutritionGoalSet["-error-end-date"]}</div>))}
                </div>
                <div className="mb-3">
                    <label htmlFor="goal-period" className="form-label">Goal Period (Days):</label>
                    <Select
                        id="goal-period"
                        name="goalPeriod"
                        options={[1, 5, 7, 10, 14, 15, 20, 21, 25, 28, 30].map(i => ({ label: i, value: i }))}
                        onChange={handlePeriodChange}
                        classNamePrefix="react-select"
                        className={`${nutritionGoalSet["-show-errors"] && nutritionGoalSet["-error-period"] ? 'is-invalid' : ''}`}
                    />
                    {(nutritionGoalSet["-show-errors"] && (<div className='error-message'>{nutritionGoalSet["-error-period"]}</div>))}
                </div>
                { nutritionGoalSet.dayModes.filter((_, i) => i > 0).map((dayMode, index) => {
                    var options = [ { label: `Same Goal as Day ${index+1}`, value: "SameGoal" }, { label: "Different Goal", value: "DifferentGoal" } ];
                    var value = options.filter(o => o.value == dayMode.type)
                    return <div className="mb-3" key={index}>
                        <label htmlFor={`dayMode-${index+1}`}>Day {index+2}:</label>
                        <Select
                            id={`dayMode-${index+1}`}
                            name="dayMode"
                            options={options}
                            onChange={(e) => handleDayModeChange(index, e)}
                            value={value}
                            className={`${nutritionGoalSet["-show-errors"] && dayMode["-error-type"] ? 'is-invalid' : ''}`}
                        />
                        {(nutritionGoalSet["-show-errors"] && (<div className='error-message'>{dayMode["-error-type"]}</div>))}
                    </div>
                })}
                <h2>Nutrients to Track</h2>
                <table className='table table-striped table-bordered'>
                    <thead>
                        <tr>
                            <th style={{width:"100%"}} scope="col">Nutrient</th>
                            <th style={{width: "1%", whiteSpace: "nowrap"}} scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {nutritionGoalSet.nutrients.map((nutrient, index) =>
                        <tr key={index}>
                            <td>
                                <label htmlFor={`nutrient-${index}`} className='visually-hidden'>Nutrient</label>
                                <Select
                                    id={`nutrient-${index}`}
                                    name="nutrientId"
                                    options={(() => {
                                        const otherSelections = nutritionGoalSet.nutrients.filter((_, idx) => idx != index).map(n => n.nutrientId);

                                        let ret = nutrientOptions.map(grp => {
                                            return ({ ... grp, options: grp.options.filter(opt => {
                                                return otherSelections.indexOf(opt.value) < 0; 
                                            }) })
                                        });

                                        return ret;
                                    })()}
                                    onChange={(selectedOption) => handleNutrientSelectionChange(index, selectedOption)}
                                    value={nutrientOptions.map(grp => grp.options).flat(1).find(option => option.value === nutrient.nutrientId) || null}
                                    classNamePrefix="react-select"
                                />
                            </td>
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
                        </tr>
                    )}
                    </tbody>
                </table>
                <div className="row mb-3">
                    <div className="col-auto align-self-end">
                        <button type="button" className="btn btn-secondary" disabled={nutritionGoalSet.nutrients.length >= Object.keys(nutrientDictionary).length} onClick={addNutrient}>Add Nutrient</button>
                    </div>
                </div>
                <h2>Target Quantities</h2>
                {false === canShowTargets() && <div>Please set up the goal period and select at least one nutrient.</div>}
                {true === canShowTargets() && nutritionGoalSet.nutrients.map((nutrient, nutIdx) => (
                    (nutrient?.nutrientId && <div key={nutIdx}>
                        <h5>{nutrientDictionary[nutrient.nutrientId]?.name}</h5>
                        {Object.entries(nutrient.targets).map(([startDay, target]) => 
                            <div className="d-flex mb-3" key={`${nutIdx}-${startDay}`}>
                                <div className="me-3">
                                    <label htmlFor="page" className="form-label">{target.start == target.end ? `Day ${target.start + 1}` : `Days ${target.start+1}-${target.end+1}`} Minimum:</label>
                                    <input
                                        min={0}
                                        value={target.minimum || ""}
                                        onChange={(e) => handleTargetMinimumChange(nutIdx, startDay, e.target.value)}
                                        type='number'
                                        className={`form-control ${(nutritionGoalSet["-show-errors"] && target["-error-minimum"]) ? "is-invalid" : ""}`}
                                        placeholder={`${nutrientDictionary[nutrient?.nutrientId]?.name} (${((unit) => unit?.abbreviationCsv?.split(',')?.[0] || unit?.name )(nutrientDictionary[nutrient.nutrientId]?.defaultUnit)})`}
                                    />
                                    {(nutritionGoalSet["-show-errors"] && (<div className='error-message'>{target["-error-minimum"]}</div>))}
                                </div>
                                <div className="me-3">
                                    <label htmlFor="page" className="form-label">{target.start == target.end ? `Day ${target.start + 1}` : `Days ${target.start+1}-${target.end+1}`} Maximum:</label>
                                    <input
                                        min={0}
                                        value={target.maximum || ""}
                                        onChange={(e) => handleTargetMaximumChange(nutIdx, startDay, e.target.value)}
                                        type='number'
                                        className={`form-control ${(nutritionGoalSet["-show-errors"] && target["-error-maximum"]) ? "is-invalid" : ""}`}
                                        placeholder={`${nutrientDictionary[nutrient?.nutrientId]?.name} (${((unit) => unit?.abbreviationCsv?.split(',')?.[0] || unit?.name )(nutrientDictionary[nutrient.nutrientId]?.defaultUnit)})`}
                                    />
                                    {(nutritionGoalSet["-show-errors"] && (<div className='error-message'>{target["-error-maximum"]}</div>))}
                                </div>
                            </div>
                        )}
                    </div>)
                ))}
                <button type="submit" className="btn btn-primary">Save</button>
            </div>
        </form>
    );
};

export default NutritionGoalSetForm;
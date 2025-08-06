import { useEffect, useState } from 'react';
import { json, Link } from 'react-router-dom';
import Select from 'react-select';
import Accordion from 'react-bootstrap/Accordion';

const NutritionGoalSetForm = () => {
    const [nutritionGoalSet, setNutritionGoalSet] = useState({ goalName: "", goalPeriod: 1, dayModes: [], nutrients: [ ] })
    const [nutrientOptions, setNutrientOptions] = useState([]);
    const [nutrientDictionary, setNutrientDictionary] = useState({});

    useEffect(() => {
        fetchNutrients();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newNutritionGoalSet = { ...nutritionGoalSet, [name]: value };
        // validateNutritionGoalSet(newNutritionGoalSet);
        setNutritionGoalSet({ ...newNutritionGoalSet, [name]: value });
    };

    const handleGoalPeriodChange = async (selectedElement) => {
        const newPeriod = parseInt(selectedElement.value);

        const newDayModes = [ ];

        for (let i = 0; i < newPeriod; i++) { newDayModes[i] = newDayModes[i] || "DifferentGoal"; }

        const newNutritionGoalSet = {... nutritionGoalSet, dayModes: newDayModes};
        setNutritionGoalSet(newNutritionGoalSet);
    };

    const addNutrient = async() => {
        const newNutrients = [... nutritionGoalSet.nutrients, { nutrientId: null }];
        const newNutritionGoalSet = {... nutritionGoalSet, nutrients: newNutrients };
        setNutritionGoalSet(newNutritionGoalSet);
    }

    const removeNutrient = (index) => {
        const nutrients = nutritionGoalSet.nutrients.filter((_, i) => i !== index);
        setNutritionGoalSet({ ...nutritionGoalSet, nutrients: nutrients });
    };

    const moveNutrientUp = (index) => {
        if (index > 0) {
            const nutrientsBefore = nutritionGoalSet.nutrients.slice(0, index - 1);
            const nutrientsAfter  = nutritionGoalSet.nutrients.slice(index + 1);
            const newNutrients = [...nutrientsBefore, nutritionGoalSet.nutrients[index], nutritionGoalSet.nutrients[index - 1], ...nutrientsAfter];
            setNutritionGoalSet({ ...nutritionGoalSet, nutrients: newNutrients});
        }
    }

    const moveNutrientDown = (index) => {
        if (index < nutritionGoalSet.nutrients.length - 1) {
            const nutrientsBefore = nutritionGoalSet.nutrients.slice(0, index);
            const nutrientsAfter  = nutritionGoalSet.nutrients.slice(index + 2);
            const nutrients = [...nutrientsBefore, nutritionGoalSet.nutrients[index + 1], nutritionGoalSet.nutrients[index], ...nutrientsAfter];
            setNutritionGoalSet({ ...nutritionGoalSet, nutrients: nutrients});
        }
    }

    const handleNutrientSelectionChange = async(index, selectedElement) => {
        const newNutrients = [... nutritionGoalSet.nutrients ];
        newNutrients[index] = { nutrientId: selectedElement.value };
        const newNutritionGoalSet = {... nutritionGoalSet, nutrients: newNutrients };
        setNutritionGoalSet(newNutritionGoalSet);
    }

    const handleDayModeChange = async(index, selectedElement) => {
        const newDayModes = [... nutritionGoalSet.dayModes];
        newDayModes[0] = "DifferentGoal";
        newDayModes[index + 1] = selectedElement.value;
        const newNutritionGoalSet = {...nutritionGoalSet, dayModes: newDayModes};
        setNutritionGoalSet(newNutritionGoalSet);
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
            if (! dayMode) {
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

    return (
        <div>
            <h1>Nutrition Goal Set</h1>
            <div className="mb-3">
                <label htmlFor="name" className="form-label">Name:</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-control"
                    onChange={handleChange}
                />
            </div>
            {/* <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Schedule</Accordion.Header>
                    <Accordion.Body> */}
                        <h2>Schedule</h2>
                        <div className="mb-3">
                            <label htmlFor="start-date" className="form-label">Start Date:</label>
                            <input
                                id="start-date"
                                name="startDate"
                                type='date'
                                className="form-control"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="end-date" className="form-label">End Date:</label>
                            <input
                                id="end-date"
                                name="endDate"
                                type='date'
                                className="form-control"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="goal-period" className="form-label">Goal Period (Days):</label>
                            <Select
                                id="goal-period"
                                name="goal-period"
                                options={[1, 5, 7, 10, 14, 15, 20, 21, 25, 28, 30].map(i => ({ label: i, value: i }))}
                                onChange={handleGoalPeriodChange}
                            />
                        </div>
                        { nutritionGoalSet.dayModes.filter((_, i) => i > 0).map((dayMode, index) => (
                            <div className="mb-3" key={index}>
                                <label htmlFor={`dayMode-${index+1}`}>Day {index+2}:</label>
                                <Select
                                    id={`dayMode-${index+1}`}
                                    name="dayMode"
                                    options={[ { label: `Same Goal as Day ${index+1}`, value: "SameGoal" }, { label: "Different Goal", value: "DifferentGoal" } ]}
                                    onChange={(e) => handleDayModeChange(index, e)}
                                />
                            </div>
                        ))}
                    {/* </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                    <Accordion.Header>Nutrients</Accordion.Header>
                    <Accordion.Body> */}
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
                                            isClearable
                                            value={nutrientOptions.map(grp => grp.options).flat(1).find(option => option.value === nutrient.nutrientId) || null}
                                            classNamePrefix="react-select"
                                            // className={`${nutritionGoalSet["-show-errors"] && nutrient["-error-nutrientId"] ? 'is-invalid' : ''}`}
                                        />
                                        {/* {(nutritionGoalSet["-show-errors"] && (<div className='error-message'>{nutrient["-error-nutrientId"]}</div>))} */}
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
                    {/* </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey='2'>
                    <Accordion.Header>Targets</Accordion.Header>
                    <Accordion.Body> */}
                        <h2>Target Quantities</h2>
                        {false === canShowTargets() && <div>Please set up the goal period and select at least one nutrient.</div>}
                        {true === canShowTargets() && nutritionGoalSet.nutrients.map((nutrient, nutIdx) => ( 
                            <div key={nutIdx}>
                                <h5>{nutrientDictionary[nutrient.nutrientId]?.name}</h5>
                                {nutritionGoalSet.dayModes.reduce((acc, val, arr)=> {
                                    if ("DifferentGoal" == val) {
                                        let newRange = { start: arr, end: arr };
                                        acc[acc.length] = newRange;
                                    }
                                    else {
                                        acc[acc.length - 1].end = arr;
                                    }

                                    return acc;
                                }, [ ]).map((o, i) => 
                                    <div className="d-flex mb-3" key={`${nutIdx}-${i}`}>
                                        <div className="me-3">
                                            <label htmlFor="page" className="form-label">Days {o.start+1}-{o.end+1} Minimum:</label>
                                            <input type='number' className='form-control' placeholder={`${nutrientDictionary[nutrient?.nutrientId]?.name} (${((unit) => unit.abbreviationCsv?.split(',')?.[0] || unit.name )(nutrientDictionary[nutrient.nutrientId].defaultUnit)})`}/>
                                        </div>
                                        <div className="me-3">
                                            <label htmlFor="page" className="form-label">Days {o.start+1}-{o.end+1} Maximum:</label>
                                            <input type='number' className='form-control' placeholder={`${nutrientDictionary[nutrient?.nutrientId]?.name} (${((unit) => unit.abbreviationCsv?.split(',')?.[0] || unit.name )(nutrientDictionary[nutrient.nutrientId].defaultUnit)})`}/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    {/* </Accordion.Body>
                </Accordion.Item>
            </Accordion> */}
            <button type='button' className='btn btn-primary'>Save</button>
        </div>
    );
};

export default NutritionGoalSetForm;
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Select from 'react-select';

const FoodItemForm = () => {
    const [foodItem, setFoodItem] = useState({ name: '', brand: '', servingSizes: [], nutrients: [] });

    const [foodQuantityUnitTypes, setFoodQuantityUnitTypes] = useState([]);
    const [unitDictionary, setUnitDictionary] = useState({});
    const [servingSizeUnitOptions, setServingSizeUnitOptions] = useState([]); // Empty 2D-array
    const [nutrientOptions, setNutrientOptions] = useState([]);
    const [nutrientDictionary, setNutrientDictionary] = useState({});
    const [nutrientUnitOptions, setNutrientUnitOptions] = useState([]); // Empty 2D-array

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNutrients();
        fetchUnits();
    }, []);

    useEffect(() => {
        if (Object.keys(unitDictionary).length > 0 && id) {
            fetchFoodItem(id);
        }
    }, [unitDictionary, id]);

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

            setFoodQuantityUnitTypes(units.filter(unit => true === unit.canBeFoodQuantity).map(u => u.type).filter((unitType, index, arr) => arr.indexOf(unitType) == index).toSorted((ut1, ut2) => ut1.localeCompare(ut2)).map(unitType => ({ value: unitType, label: unitType })))

            return units;
        }
        catch (error) {
            console.error(`Request to ${url} failed.`, error)
        }
    }

    const fetchFoodItem = async (id) => {
        const response = await fetch(`/api/fooditems/${id}`);
        const data = await response.json();
        setFoodItem(data);

        data.nutrients.forEach(element => {
            
        });

        const initialServingSizeUnitOptions = data.servingSizes.map((s) => Object.values(unitDictionary).filter(u => u.type == s.unitType).map(u => ({ label: u.name, value: u.id })));
        setServingSizeUnitOptions(initialServingSizeUnitOptions);

        const initialNutrientUnitOptions = data.nutrients.map((n) => Object.values(unitDictionary).filter(u => u.type == unitDictionary[n.unitId].type).map(u => ({ label: u.name, value: u.id })));
        setNutrientUnitOptions(initialNutrientUnitOptions);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFoodItem({ ...foodItem, [name]: value });
    };

    const handleServingSizeChange = (index, e) => {
        const { name, value } = e.target;
        const servingSizes = [...foodItem.servingSizes];
        servingSizes[index] = { ...servingSizes[index], [name]: value };
        setFoodItem({ ...foodItem, servingSizes: servingSizes});
    };

    const handleServingSizeUnitTypeSelectionChange = (index, selectedOption) => {
        const possibleUnits = Object.values(unitDictionary).filter(u => u.type == selectedOption.value);

        const newUnitOptions = [...servingSizeUnitOptions];
        newUnitOptions[index] = possibleUnits.toSorted((u1, u2) => u1.displayOrder - u2.displayOrder).map(u => ({ label: u.name, value: u.id }));
        setServingSizeUnitOptions(newUnitOptions);

        const newServingSizes = [ ...foodItem.servingSizes];
        newServingSizes[index].unitType = selectedOption?.value;
        const newFoodItem = { ...foodItem, servingSizes: newServingSizes };
        setFoodItem(newFoodItem);
    };

    const handleServingSizeUnitSeelctionChange = (index, selectedOption) => {
        const newServingSizes = [ ...foodItem.servingSizes];
        newServingSizes[index].unitId = selectedOption?.value;
        const newFoodItem = { ...foodItem, servingSizes: newServingSizes };
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

            const servingSizeUnitOptionsBefore = servingSizeUnitOptions.slice(0, index - 1);
            const servingSizeUnitOptionsAfter = servingSizeUnitOptions.slice(index + 1);
            const newServingSizeUnitOptions = [...servingSizeUnitOptionsBefore, servingSizeUnitOptions[index], servingSizeUnitOptions[index-1], ...servingSizeUnitOptionsAfter];
            setServingSizeUnitOptions(newServingSizeUnitOptions);
        }
    }

    const moveServingSizeDown = (index) => {
        if (index < foodItem.servingSizes.length - 1) {
            const servingSizesBefore = foodItem.servingSizes.slice(0, index);
            const servingSizesAfter  = foodItem.servingSizes.slice(index + 2);
            const servingSizes = [...servingSizesBefore, foodItem.servingSizes[index + 1], foodItem.servingSizes[index], ...servingSizesAfter];
            setFoodItem({ ...foodItem, servingSizes: servingSizes});

            const servingSizeUnitOptionsBefore = servingSizeUnitOptions.slice(0, index);
            const servingSizeUnitOptionsAfter = servingSizeUnitOptions.slice(index + 2);
            const newServingSizeUnitOptions = [...servingSizeUnitOptionsBefore, servingSizeUnitOptions[index + 1], servingSizeUnitOptions[index], ...servingSizeUnitOptionsAfter];
            setServingSizeUnitOptions(newServingSizeUnitOptions);
        }
    }

    const handleNutrientChange = (index, e) => {
        const { name, value } = e.target;
        const nutrients = [...foodItem.nutrients];
        nutrients[index] = { ...nutrients[index], [name]: value };
        setFoodItem({ ...foodItem, nutrients: nutrients });
    };

    const handleNutrientSelectionChange = (index, selectedOption) => {
        const selectedNutrient = nutrientDictionary[selectedOption.value];
        const possibleUnits = Object.values(unitDictionary).filter(u => u.type == selectedNutrient.defaultUnit.type);

        const newUnitOptions = [...nutrientUnitOptions];
        newUnitOptions[index] = possibleUnits.toSorted((u1, u2) => u1.displayOrder - u2.displayOrder).map(u => ({ label: u.name, value: u.id }));
        setNutrientUnitOptions(newUnitOptions);

        const newNutrients = [ ...foodItem.nutrients];
        newNutrients[index].nutrientId = selectedOption?.value;
        newNutrients[index].unitId = selectedNutrient.defaultUnit.id;
        const newFoodItem = { ...foodItem, nutrients: newNutrients };
        setFoodItem(newFoodItem);
    };

    const handleNutrientUnitChange = (selectedOption, index) => {
        const newNutrients = [ ...foodItem.nutrients];
        newNutrients[index].unitId = selectedOption?.value;
        const newFoodItem = { ...foodItem, nutrients: newNutrients };
        setFoodItem(newFoodItem);
    };

    const addNutrient = () => {
        setNutrientUnitOptions([ ...nutrientUnitOptions, [ ] ]);
        setFoodItem({ ...foodItem, nutrients: [...foodItem.nutrients, { quantity: 0, nutrientId: '', unitId: '' }] });
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

            const nutrientUnitOptionsBefore = nutrientUnitOptions.slice(0, index - 1);
            const nutrientUnitOptionsAfter = nutrientUnitOptions.slice(index + 1);
            const newNutrientUnitOptions = [...nutrientUnitOptionsBefore, nutrientUnitOptions[index], nutrientUnitOptions[index-1], ...nutrientUnitOptionsAfter];
            setNutrientUnitOptions(newNutrientUnitOptions);
        }
    }

    const moveNutrientDown = (index) => {
        if (index < foodItem.nutrients.length - 1) {
            const nutrientsBefore = foodItem.nutrients.slice(0, index);
            const nutrientsAfter  = foodItem.nutrients.slice(index + 2);
            const nutrients = [...nutrientsBefore, foodItem.nutrients[index + 1], foodItem.nutrients[index], ...nutrientsAfter];
            setFoodItem({ ...foodItem, nutrients: nutrients});

            const nutrientUnitOptionsBefore = nutrientUnitOptions.slice(0, index);
            const nutrientUnitOptionsAfter = nutrientUnitOptions.slice(index + 2);
            const newNutrientUnitOptions = [...nutrientUnitOptionsBefore, nutrientUnitOptions[index + 1], nutrientUnitOptions[index], ...nutrientUnitOptionsAfter];
            setNutrientUnitOptions(newNutrientUnitOptions);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (id) {
            await fetch(`/api/fooditems/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(foodItem),
            });
        } else {
            await fetch('/api/fooditems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(foodItem),
            });
        }
        navigate('/FoodItemList');
    };

    return (
        <form autoComplete="off" onSubmit={handleSubmit}>
            <h4>Food Item</h4>
            <div className="d-flex mb-3">
                <div className="me-3">
                    <label htmlFor="foodItem-name" className="form-label">Name:</label>
                    <input
                        id="foodItem-name"
                        type="text"
                        name="name"
                        className="form-control"
                        value={foodItem?.name}
                        onChange={handleChange}
                        required
                    />
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
            </div>
            <h5>Serving Sizes</h5>
            
            {foodItem.servingSizes.map((servingSize, index) => (
                <div key={index} className="row mb-3">
                    <div className='col'>
                        <label htmlFor={`servingSize-unit-type-${index}`}>Unit Type:</label>
                        <Select
                            id={`servingSize-unit-type-${index}`}
                            options={foodQuantityUnitTypes}
                            onChange={(selectedOption) => handleServingSizeUnitTypeSelectionChange(index, selectedOption)}
                            value={foodQuantityUnitTypes.find(option => option.value == servingSize.unitType) || null}
                        />
                    </div>
                    <div className='col'>
                        <label htmlFor={`servingSize-unit-${index}`}>Unit:</label>
                        <Select
                            id={`servingSize-unit-${index}`}
                            options={servingSizeUnitOptions[index]}
                            onChange={(selectedOption) => handleServingSizeUnitSeelctionChange(index, selectedOption)}
                            value={servingSizeUnitOptions[index]?.find(option => option.value === servingSize.unitId) || null}
                        />
                    </div>                    
                    <div className="col">
                        <label htmlFor={`servingSize-quantity-${index}`}>Quantity:</label>
                        <input
                            id={`servingSize-quantity-${index}`}
                            type="number"
                            name="quantity"
                            className="form-control"
                            value={servingSize.quantity}
                            onChange={(e) => handleServingSizeChange(index, e)}
                            placeholder="Quantity"
                            required
                        />
                    </div>
                    <div className="col-auto align-self-end">
                        <div className="btn-group" role="group" aria-label="Button group">
                            <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => moveServingSizeUp(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                            <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => moveServingSizeDown(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                            <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => removeServingSize(index)}><i className="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            ))}
            <button type="button" className="btn btn-secondary mb-3" onClick={addServingSize}>Add Serving Size</button>
            <h5>Nutrition Information per Serving</h5>
            {foodItem.nutrients.map((nutrient, index) => (
                <div key={index} className="row mb-3">
                    <div className="col">
                        <label htmlFor={`foodItem-nutrient-${index}`}>Nutrient</label>
                        <Select
                            id={`foodItem-nutrient-${index}`}
                            name="nutrientId"
                            options={nutrientOptions}
                            onChange={(selectedOption) => handleNutrientSelectionChange(index, selectedOption)}
                            isClearable
                            value={nutrientOptions.map(grp => grp.options).flat(1).find(option => option.value === nutrient.nutrientId) || null}
                        />
                    </div>
                    <div className="col">
                        <label htmlFor={`foodItem-nutrient-${index}`}>Quantity</label>
                        <input
                            id={`foodItem-nutrient-${index}`}
                            type="number"
                            name="quantity"
                            className="form-control"
                            value={nutrient.quantity}
                            onChange={(e) => handleNutrientChange(index, e)}
                            placeholder="Quantity"
                            required
                        />
                    </div>
                    <div className="col">
                        <label htmlFor={`foodItem-nutrient-${index}`}>Quantity Unit</label>
                        <Select
                            id={`foodItem-nutrient-${index}`}
                            name="unitId"
                            options={nutrientUnitOptions[index]}
                            onChange={(selectedOption) => handleNutrientUnitChange(selectedOption, index)}
                            isClearable
                            value={nutrientUnitOptions[index]?.find(option => option.value === nutrient.unitId) || null}
                        />
                    </div>
                    <div className="col-auto align-self-end">
                        <div className="btn-group" role="group" aria-label="Button group">
                            <button type="button" aria-label='Move Up' className="btn btn-primary" onClick={() => moveNutrientUp(index)}><i className="bi bi-arrow-up" aria-hidden="true"></i></button>
                            <button type="button" aria-label='Move Down' className="btn btn-secondary" onClick={() => moveNutrientDown(index)}><i className="bi bi-arrow-down" aria-hidden="true"></i></button>
                            <button type="button" area-label='Remove' className="btn btn-danger" onClick={() => removeNutrient(index)}><i className="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            ))}
            <div className="row mb-3">
                <div className="col-auto align-self-end">
                    <button type="button" className="btn btn-secondary" onClick={addNutrient}>Add Nutrient</button>
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
        </form>
    );
};

export default FoodItemForm;
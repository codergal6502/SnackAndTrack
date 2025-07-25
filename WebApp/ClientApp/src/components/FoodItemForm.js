import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import UnitSelector from './UnitSelector'

const FoodItemForm = () => {
    const [foodItem, setFoodItem] = useState({ name: '', brand: '', servingSizes: [], nutrients: [] });
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetchFoodItem(id);
        }
    }, [id]);

    const fetchFoodItem = async (id) => {
        const response = await fetch(`/api/fooditems/${id}`);
        const data = await response.json();
        setFoodItem(data);
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
    }

    const addServingSize = () => {
        setFoodItem({ ...foodItem, servingSizes: [...foodItem.servingSizes, { unitId: "", quantity: 0 }] });
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

    const handleNutrientChange = (index, e) => {
        const { name, value } = e.target;
        const nutrients = [...foodItem.nutrients];
        nutrients[index] = { ...nutrients[index], [name]: value };
        setFoodItem({ ...foodItem, nutrients: nutrients });
    };

    const addNutrient = () => {
        setFoodItem({ ...foodItem, nutrients: [...foodItem.nutrients, { name: '', quantity: 0 }] });
    };

    const removeNutrient = (index) => {
        const nutrients = foodItem.nutrients.filter((_, i) => i !== index);
        setFoodItem({ ...foodItem, nutrients: nutrients });
    };

    const moveNutrientUp = (index) => {
        if (index > 0) {
            const nutrientsBefore = foodItem.nutrients.slice(0, index - 1);
            const nutrientsAfter  = foodItem.nutrients.slice(index + 1);
            const nutrients = [...nutrientsBefore, foodItem.nutrients[index], foodItem.nutrients[index - 1], ...nutrientsAfter];
            setFoodItem({ ...foodItem, nutrients: nutrients});
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
        <form onSubmit={handleSubmit}>
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
                    <UnitSelector name="unitId" idPrefix="foodItem-" idSuffix={`-${index}`} onUnitChange={(e) => handleServingSizeChange(index, e)} unitType={servingSize.unitType} unitId={servingSize.unitId} />
                    <div className="col">
                        <label htmlFor={`foodItem-quantity-${index}`}>Quantity:</label>
                        <input
                            id={`foodItem-quantity-${index}`}
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
                        <input
                            id={`foodItem-nutrient-${index}`}
                            type="text"
                            name="name"
                            className="form-control"
                            value={nutrient.name}
                            onChange={(e) => handleNutrientChange(index, e)}
                            placeholder="Nutrient"
                            required
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
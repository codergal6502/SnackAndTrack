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
        setFoodItem({ ...foodItem, servingSizes: [...foodItem.servingSizes, { unitId: null, quantity: 0 }] });
    };

    const removeServingSize = (index) => {
        const servingSizes = foodItem.servingSizes.filter((_, i) => i !== index);
        setFoodItem({ ...foodItem, servingSizes: servingSizes });
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
                <div class="me-3">
                    <label for="foodItem-name" class="form-label">Name:</label>
                    <input
                        id="foodItem-name"
                        type="text"
                        name="name"
                        className="form-control"
                        value={foodItem.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div class="me-3">
                    <label for="foodItem-brand" class="form-label">Brand:</label>
                    <input
                        id="foodItem-brand"
                        type="text"
                        name="brand"
                        className="form-control"
                        value={foodItem.brand}
                        onChange={handleChange}
                    />
                </div>
            </div>
            <h5>Serving Sizes</h5>
            {foodItem.servingSizes.map((servingSize, index) => (
                <div key={index} className="row mb-3">
                    <UnitSelector name="unit" idPrefix="foodItem-" idSuffix={`-${index}`} onUnitChange={(e) => handleServingSizeChange(index, e)} unitId={servingSize.unitId} />
                    <div class="col">
                        <label for={`foodItem-quantity-${index}`}>Quantity:</label>
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
                    <div class="col-auto align-self-end">
                        <button type="button" className="btn btn-danger" onClick={() => removeServingSize(index)}>Remove</button>
                    </div>
                </div>
            ))}
            <button type="button" class="btn btn-secondary mb-3" onClick={addServingSize}>Add Serving Size</button>
            <h5>Nutrition Information per Serving</h5>
            {foodItem.nutrients.map((nutrient, index) => (
                <div key={index} className="row mb-3">
                    <div class="col">
                        <label for={`foodItem-nutrient-${index}`}>Nutrient</label>
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
                    <div class="col">
                        <label for={`foodItem-nutrient-${index}`}>Quantity</label>
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
                    <div class="col-auto align-self-end">
                        <button type="button" className="btn btn-danger" onClick={() => removeNutrient(index)}>Remove</button>
                    </div>
                </div>
            ))}
            <div class="row mb-3">
                <div class="col-auto align-self-end">
                    <button type="button" class="btn btn-secondary" onClick={addNutrient}>Add Nutrient</button>
                </div>
            </div>
            <h5>Actions</h5>
            <div class="row mb-3">
                <div class="col-auto align-self-end">
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
                <div class="col-auto align-self-end">
                    <button type="button" class="btn btn-secondary" onClick={() => navigate('/FoodItemList')}>Cancel</button>
                </div>
            </div>
        </form>
    );
};

export default FoodItemForm;
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const FoodItemForm = () => {
    const [foodItem, setFoodItem] = useState({ name: '', brand: '' });
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
            <div className="form-group">
                <label>Name</label>
                <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={foodItem.name}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>Brand</label>
                <input
                    type="text"
                    name="brand"
                    className="form-control"
                    value={foodItem.brand}
                    onChange={handleChange}
                    required
                />
            </div>
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/FoodItemList')}>Cancel</button>
        </form>
    );
};

export default FoodItemForm;
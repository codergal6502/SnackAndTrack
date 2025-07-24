import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FoodItem from './FoodItem';

const FoodItemList = () => {
    const [foodItems, setFoodItems] = useState([]);

    useEffect(() => {
        fetchFoodItems();
    }, []);

    const fetchFoodItems = async () => {
        const response = await fetch('/api/fooditems');
        const data = await response.json();
        setFoodItems(data);
    };

    const handleDelete = async (id) => {
        await fetch(`/api/fooditems/${id}`, {
            method: 'DELETE',
        });
        fetchFoodItems();
    };

    return (
        <div>
            <h1>Food Items</h1>
            <Link to="/fooditemform" className="btn btn-primary mb-3">Add Food Item</Link>
            <table className="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {foodItems.map(item => (
                        <FoodItem key={item.id} foodItem={item} onDelete={handleDelete} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FoodItemList;

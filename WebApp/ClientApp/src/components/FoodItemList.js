import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
            <table className='table table-striped table-bordered'>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Brand</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {foodItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.brand}</td>
                            <td>
                                <Link to={`/fooditemform/${item.id}`} className="btn btn-warning">Edit</Link>
                                <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FoodItemList;

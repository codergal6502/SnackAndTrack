import { Link } from 'react-router-dom';

const FoodItem = ({ foodItem, onDelete }) => {
    return (
        <tr>
            <td>{foodItem.name}</td>
            <td>
                <Link to={`/fooditemform/${foodItem.id}`} className="btn btn-warning">Edit</Link>
                <button className="btn btn-danger" onClick={() => onDelete(foodItem.id)}>Delete</button>
            </td>
        </tr>
    );
};

export default FoodItem;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';

const NutritionGoalSetList = () => {
    return (
        <div>
            <h1>Nutritionan Goal Sets</h1>
            <Link to="/nutrietionGoalSetForm" className="btn btn-primary mb-3">Add Nutrition Goal Set</Link>
        </div>
    );
};

export default NutritionGoalSetList;

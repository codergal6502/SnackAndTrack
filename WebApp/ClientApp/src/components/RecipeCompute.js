import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";

const RecipeCompute = () => {
    const [recipe, setRecipe] = useState({ name: '', source: '', ingredients: [], amountsMade: [] });
    const [nutritionTable, setNutritionTable] = useState([]);
    const [showNutritionTable, setShowNutritionTable] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (! id) {
            navigate('/RecipeList');
            return;
        }

        fetchRecipe(id);
    }, [id]);

    const fetchRecipe = async (id) => {
        const response = await fetch(`api/recipes/${id}`);
        const data = await response.json();
        setRecipe(data);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
    }

    const handleCompute = async (id) => {
        const response = await fetch(`/api/recipes/computeFoodItem/${id}`);
        const data = await response.json();

        setNutritionTable(data);
        setShowNutritionTable(true);
        debugger;
    }

    return (
        <form onSubmit={handleSubmit}>
            <h4>Compute Recipe Nutrition</h4>
            <div className="row me-3">
                <label htmlFor="recipe-name" className="col-sm-1 col-form-label">Name:</label>
                <div className="col-sm-4">
                    <input
                        id="recipe-name"
                        type="text"
                        name="name"
                        className="form-control"
                        value={recipe.name}
                        readOnly
                    />
                </div>
                <label htmlFor="recipe-source" className="col-sm-1 col-form-label">Source:</label>
                <div className="col-sm-4">
                    <input
                        id="recipe-source"
                        type="text"
                        name="source"
                        className="form-control"
                        value={recipe.source}
                        readOnly
                    />
                </div>
            </div>
            <h5>Ingredients</h5>
            <table className='table'>
                <thead>
                    <tr>
                        {(recipe.ingredients.map((ingredient, index) => (
                            <th key={index} scope="col">{ingredient.foodItemName}</th>
                        )))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {(recipe.ingredients.map((ingredient, index) => (
                            <td key={index} scope="col">{ingredient.quantity} {ingredient.quantityUnitName}</td>
                        )))}
                    </tr>
                </tbody>
            </table>
            <button className='btn btn-primary' onClick={() => handleCompute(id)}>Compute Food Item Nutrition</button>
            {showNutritionTable && (
                <>
                    <h5>Nutrition</h5>
                    <table className='table table-striped table-bordered'>
                        <thead>
                            <tr>
                                <th scope='col'>Ingredient</th>
                                {(recipe.ingredients.map((ingredient, index) => (
                                    <th key={index} scope="col">{ingredient.foodItemName}</th>
                                )))}
                                <th scope="col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(nutritionTable.nutrientSummaries.map((nutrientSummary, index) => {
                                let total = 0;
                                return ( 
                                <tr key={index}>
                                    <th scope="row">{nutrientSummary.nutrientName}</th>
                                    {(recipe.ingredients.map((ingredient, index) => {
                                        const foodItemContribution = nutrientSummary.foodItemContributions.filter(fic => fic.foodItemId === ingredient.foodItemId);
                                        const rounded = Math.round(foodItemContribution[0].nutrientQuantity)
                                        total += rounded;
                                        return (
                                            <td key={index}>{ typeof(foodItemContribution[0].nutrientQuantity) != "number" ?  '-' : rounded }</td>
                                        );
                                    }))}
                                    <td>{total}</td>
                                </tr>
                            );}))}
                        </tbody>
{/* 

[
    {
        "nutrientId": "3edda1ac-4719-48d8-8d23-fe3c85b7dfa5",
        "nutrientName": "Saturated Fat",
        "foodItemContributions": [
            {
                "nutrientQuantity": 0,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "5ad9590f-e359-4576-92a4-1aa671b0a9d6",
        "nutrientName": "Calcium",
        "foodItemContributions": [
            {
                "nutrientQuantity": 56.69905,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "b6906a99-e762-4ec7-8d73-f85054cefe8d",
        "nutrientName": "Added Sugar",
        "foodItemContributions": [
            {
                "nutrientQuantity": 0,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "52e7a419-83bd-49b0-b8b7-b6eae777918b",
        "nutrientName": "Trans Fat",
        "foodItemContributions": [
            {
                "nutrientQuantity": 0,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "c6932e5e-a815-4ac8-8dd9-ef6dcc87827d",
        "nutrientName": "Total Fat",
        "foodItemContributions": [
            {
                "nutrientQuantity": 5.6699047,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": 0,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "4f867c71-2f57-480d-9c8e-54b76247b38c",
        "nutrientName": "Potassium",
        "foodItemContributions": [
            {
                "nutrientQuantity": 700.80023,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": 23.5,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "b937e367-8325-4a0d-b114-285bcc37ad25",
        "nutrientName": "Sodium",
        "foodItemContributions": [
            {
                "nutrientQuantity": 22.679619,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": 2.5,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": 590,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "e2623a0f-af61-4ede-b491-8ff4d793919d",
        "nutrientName": "Total Sugars",
        "foodItemContributions": [
            {
                "nutrientQuantity": 0,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "e5710ef5-e7f6-4d52-abe7-b095203257db",
        "nutrientName": "Iron",
        "foodItemContributions": [
            {
                "nutrientQuantity": 4.535924,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "29e112a0-3981-4080-9449-570892227107",
        "nutrientName": "Total Carbohydrates",
        "foodItemContributions": [
            {
                "nutrientQuantity": 61.234974,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": 0.5,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "c7b9695a-bba9-4185-b485-e2a3e5727568",
        "nutrientName": "Calories",
        "foodItemContributions": [
            {
                "nutrientQuantity": 362.8739,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": 5,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": 0,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "8ecf47d5-354b-4204-b520-68952c2f6470",
        "nutrientName": "Cholesterol",
        "foodItemContributions": [
            {
                "nutrientQuantity": 0,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "fb1ec6e1-c140-4f4d-bbb3-db52a96ee2ba",
        "nutrientName": "Protein",
        "foodItemContributions": [
            {
                "nutrientQuantity": 20.411657,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": 0.6666667,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": 0,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "5fbb6e05-09a9-403d-b731-d1074cb6a0a4",
        "nutrientName": "Dietary Fiber",
        "foodItemContributions": [
            {
                "nutrientQuantity": 11.339809,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": 0.33333334,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "fd386dbd-7f65-4355-99ac-c9e1631681af",
        "nutrientName": "Vitamin D",
        "foodItemContributions": [
            {
                "nutrientQuantity": 0,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "1425f232-4b18-467d-8fbc-220d3ee3b4ce",
        "nutrientName": "Iodine",
        "foodItemContributions": [
            {
                "nutrientQuantity": null,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": 68,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    },
    {
        "nutrientId": "6e669e97-3e12-476e-abe2-edc36853e0a8",
        "nutrientName": "Total Carbohydrate",
        "foodItemContributions": [
            {
                "nutrientQuantity": null,
                "foodItemName": "Chickpeas, Slow-Cooked Dry",
                "foodItemId": "1ef5941f-ccc0-441e-8d43-f3ee4db773d5"
            },
            {
                "nutrientQuantity": null,
                "foodItemName": "Nutritional Yeast",
                "foodItemId": "b30d8332-044b-47c5-a3de-889a02988613"
            },
            {
                "nutrientQuantity": 0,
                "foodItemName": "Iodized Salt",
                "foodItemId": "9c36790c-4f41-4b3e-aff9-f84f3c608dba"
            }
        ]
    }
]

*/}

                    </table>
                </>
            )}
        </form>
    );
}

export default RecipeCompute;
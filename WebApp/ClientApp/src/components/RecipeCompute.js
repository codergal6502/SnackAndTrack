import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";

import Modal from 'react-bootstrap/Modal';
import Select from 'react-select';

import { displayOrderCompareFn, yesNoOptions } from '../utilties';
import { DateTime } from "luxon";

const defaultModalState = { showError: false, errorHttpStatus: null, errorMessage: null };
const markOthersOptions = [{label: "Mark Not Usable in Food Journal", value: true}, {label: "Do Not Modify", value: false}];
const todayString = DateTime.now().toISODate();

const RecipeCompute = () => {
    const [recipe, setRecipe] = useState({ name: '', source: '', ingredients: [], amountsMade: [] });
    const [foodItemSetup, setFoodItemSetup] = useState({ recipeId: '', usableInFoodJournal: true, markOthersNotUsableInFoodJournal: true, batchDate: todayString, servingSizeConversions: [] })
    const [nutritionTable, setNutritionTable] = useState(null);

    const [modalState, setModalState] = useState(defaultModalState);

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetchRecipe(id);
        }
    }, [id]);

    const fetchRecipe = async (id) => {
        const response = await fetch(`api/recipes/${id}`);
        const data = await response.json();
        setRecipe(data);
        const newFoodItemSetup = { name: data.name, recipeId: data.id, usableInFoodJournal: true, markOthersNotUsableInFoodJournal: true, batchDate: todayString, servingSizeConversions: data.amountsMade.map(am => ({ unitId: am.quantityUnitId, quantity: "", amountMade: am })) };
        setFoodItemSetup(newFoodItemSetup)
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hasErrors = validateAndSetFoodItemSetup(foodItemSetup);

        if (!hasErrors) {
            try {
                const response = await fetch('/api/recipes/createFoodItemForRecipe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(foodItemSetup),
                });
    
                if (response.ok) {
                    const data = await response.json();
    
                    navigate(`/FoodItemForm/${data.foodItemId}`);
                }
                else {
                    setModalState(
                        {
                            ...defaultModalState
                          , showError: true
                          , errorHttpStatus: response.status
                          , errorMessage: (await response.text())?.toString()?.trim() ?? response.statusText
                        }
                    );
                }
            }
            catch(err) {
                setModalState(
                    {
                        ...defaultModalState
                      , showError: true
                      , errorMessage: await err.toString()
                    }
                );
            }
        }
    }

    const handleCompute = async (id) => {
        const response = await fetch(`/api/recipes/computeFoodItem/${id}`);
        const data = await response.json();

        setNutritionTable(data);
    }

    const handleBatchDateInputChange = (newDateString) => {
        const newDateObject = DateTime.fromISO(newDateString);
        if (newDateObject?.isValid) {
            newDateString = newDateObject.toISODate();
        }
        else {
            newDateString = "";
        }

        const newFoodItemSetup = { ...foodItemSetup, batchDate: newDateString};
        validateFoodItemSetupAndMarkAsChanged(newFoodItemSetup);
        setFoodItemSetup(newFoodItemSetup);
    }

    const handleBatchDateClearButton = () => {
        const newFoodItemSetup = { ...foodItemSetup, batchDate: ""};
        validateFoodItemSetupAndMarkAsChanged(newFoodItemSetup);
        setFoodItemSetup(newFoodItemSetup);
    }

    const handleUsableInFoodJournalChange = (selectedOptions) => {
        const selectedOption = Array.isArray(selectedOptions) ? selectedOptions[0] : selectedOptions;
        const newFoodItemSetup = { ...foodItemSetup, usableInFoodJournal: selectedOption.value};
        validateFoodItemSetupAndMarkAsChanged(newFoodItemSetup);
        setFoodItemSetup(newFoodItemSetup);
    }

    const handleMarkOthersNotUsableInFoodJournalChange = (selectedOptions) => {
        const selectedOption = Array.isArray(selectedOptions) ? selectedOptions[0] : selectedOptions;
        const newFoodItemSetup = { ...foodItemSetup, usableInFoodJournal: selectedOption.value};
        validateFoodItemSetupAndMarkAsChanged(newFoodItemSetup);
        setFoodItemSetup(newFoodItemSetup);
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const newFoodItemSetup = { ...foodItemSetup, [name]: value};
        validateFoodItemSetupAndMarkAsChanged(newFoodItemSetup);
        setFoodItemSetup(newFoodItemSetup);
    }

    const handleServingSizeInputChange = (index, e) => {
        const { name, value } = e.target;
        const servingSizes = [...foodItemSetup.servingSizeConversions];
        servingSizes[index] = { ...servingSizes[index], [name]: value };
        const newFoodItemSetup = { ...foodItemSetup, servingSizeConversions: servingSizes };
        validateFoodItemSetupAndMarkAsChanged(newFoodItemSetup);
        setFoodItemSetup(newFoodItemSetup);
    };

    const handleCalculateOtherRows = (index) => {
        const ratio = foodItemSetup.servingSizeConversions[index].quantity / recipe.amountsMade[index].quantity;
        const newServingSizes = [...foodItemSetup.servingSizeConversions];

        for (let i = 0; i < foodItemSetup.servingSizeConversions.length; i++) {
            if (index === i) continue;
            newServingSizes[i].quantity = ratio * recipe.amountsMade[i].quantity;
        }

        const newFoodItemSetup = { ...foodItemSetup, servingSizeConversions: newServingSizes};
        validateFoodItemSetupAndMarkAsChanged(newFoodItemSetup);
        setFoodItemSetup(newFoodItemSetup);
    }

    const validateAndSetFoodItemSetup = (foodItemSetup) => {
        const newFoodItemSetup = { ... foodItemSetup, "-show-errors": true };
        validateFoodItemSetupAndMarkAsChanged(newFoodItemSetup);
        
        setFoodItemSetup(newFoodItemSetup);
        return newFoodItemSetup["-has-errors"];
    }

    const validateFoodItemSetupAndMarkAsChanged = (newFoodItemSetup) => {
        return validateFoodItemSetup(newFoodItemSetup);
    }

    const validateFoodItemSetup = (newFoodItemSetup) => {
        let hasErrors = false;

        hasErrors = validateFoodItemSetupServingSizeConversions(newFoodItemSetup) || hasErrors;

        newFoodItemSetup["-has-errors"] = hasErrors;

        return hasErrors;
    };

    const validateFoodItemSetupServingSizeConversions = (newFoodItemSetup) => {
        let hasErrors = false;
        const newServingSizeConversions = [... newFoodItemSetup.servingSizeConversions];

        for (const newServingSizeConversion of newServingSizeConversions) {
            hasErrors = validateServingSizeConversion(newServingSizeConversion) || hasErrors;
        }

        return hasErrors;
    }

    const validateServingSizeConversion = (newServingSizeConversion) => {
        let hasErrors = false;

        var quantityFloat = parseFloat(newServingSizeConversion.quantity);

        if (isNaN(quantityFloat)) {
            // Probably impossible.
            newServingSizeConversion["-error-quantity"] = "Serving size quantity must be a number.";
            hasErrors = true;
        }
        else if (0 >= quantityFloat) {
            newServingSizeConversion["-error-quantity"] = "Serving size quantity must be positive.";
            hasErrors = true;
        }
        else {
            delete newServingSizeConversion["-error-quantity"];
        }

        return hasErrors;
    };

    return (
        <form onSubmit={handleSubmit} autoComplete='Off'>
            <h4>Compute Recipe Nutrition</h4>
            <div className="row mb-3">
                <label htmlFor="recipe-name" className="col-sm-1 col-form-label">Name:</label>
                <div className="col-sm-4">
                    <input
                        id="recipe-name"
                        type="text"
                        name="name"
                        className="form-control"
                        value={recipe.name}
                        onChange={handleInputChange}
                    />
                </div>
            </div>
            <h5>Ingredients</h5>
            <table className='table table-striped table-bordered'>
                <thead>
                    <tr>
                        <th scope='row'>Ingredient</th>
                        {(recipe.ingredients.map((ingredient, index) => (
                            <th key={index} scope="col">{ingredient.foodItemName}</th>
                        )))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope='row'>Quantity</th>
                        {(recipe.ingredients.map((ingredient, index) => (
                            <td key={index} scope="col">{ingredient.quantity} {ingredient.quantityUnitName}</td>
                        )))}
                    </tr>
                </tbody>
            </table>
            <button type="button" className='btn btn-primary mb-3' onClick={() => handleCompute(id)}>Generate Table</button>
            {nutritionTable && (
                <>
                    <h5>Nutrition</h5>
                    <table className='table table-striped table-bordered'>
                        <thead>
                            <tr>
                                <th scope='col'>Nutrient</th>
                                {(nutritionTable.recipeIngredients.toSorted(displayOrderCompareFn).map((ingredient, index) => (
                                    <th key={index} scope="col">{ingredient.foodItemName}</th>
                                )))}
                                <th scope="col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(nutritionTable.nutrientSummaries.toSorted((n1, n2) => n1.nutrientUnitDisplayOrder - n2.nutrientUnitDisplayOrder).map((nutrientSummary, index) => {
                                return ( 
                                <tr key={index}>
                                    <th scope="row">{nutrientSummary.nutrientName}</th>
                                    {(nutritionTable.recipeIngredients.toSorted(displayOrderCompareFn).map((ingredient, index) => {
                                        const [foodItemContribution] = nutrientSummary.foodItemContributions.filter(fic => fic.foodItemId === ingredient.foodItemId);
                                        const rounded = Math.round(foodItemContribution.nutrientQuantity)
                                        return (
                                            <td key={index}>{ typeof(foodItemContribution.nutrientQuantity) != "number" ?  '-' : `${rounded } ${foodItemContribution.nutrientUnitName}` }</td>
                                        );
                                    }))}
                                    <td>{Math.round(nutrientSummary.totalQuantity)} {nutrientSummary.nutrientUnitName} {(nutrientSummary.percentDailyValue) && ( `(${Math.round(nutrientSummary.percentDailyValue)}% dv)` ) }</td>
                                </tr>
                            );}))}
                        </tbody>
                    </table>

                    <h5>Create Food Item</h5>
                    <h6>Serving Sizes</h6>
                    <table className='table table-striped table-bordered'>
                        <thead>
                            <tr>
                                <th scope="col">Unit</th>
                                <th scope="col">Recipes Makes</th>
                                <th scope="col">One Serving Is</th>
                            </tr>
                        </thead>
                        <tbody>
                            {foodItemSetup.servingSizeConversions.map((ssc, index) => (
                                <tr key={index}>
                                    <td><span className='form-control'>{ssc.amountMade.quantityUnitName}</span></td>
                                    <td><span className='form-control'>{ssc.amountMade.quantity}</span></td>
                                    <td>
                                        <label className='visually-hidden' htmlFor={`servingSize-quantity-${index}`}>Quantity ({ssc.amountMade.quantityUnitName}):</label>
                                        <div className="input-group">
                                            <input
                                                id={`servingSize-quantity-${index}`}
                                                type="number"
                                                name="quantity"
                                                className={`form-control ${(foodItemSetup["-show-errors"] && ssc["-error-quantity"]) ? "is-invalid" : ""}`}
                                                value={ssc.quantity}
                                                onChange={(e) => handleServingSizeInputChange(index, e)}
                                                placeholder={ssc.quantityUnitName}
                                            />
                                            <button className="btn btn-secondary" type="button" onClick={() => handleCalculateOtherRows(index)}>Calculate Other Rows</button>
                                        </div>
                                        {(foodItemSetup["-show-errors"] && (<div className='error-message'>{ssc["-error-quantity"]}</div>))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <h6>Options</h6>

                    <div className="d-flex mb-3">
                        <div className="me-3">
                            <label htmlFor="usableInFoodJournal" className="form-label">Usable in Food Journal:</label>
                            <Select
                                id="usableInFoodJournal"
                                options={yesNoOptions}
                                name="usableInFoodJournal"
                                value={yesNoOptions.filter(opt => opt.value == foodItemSetup.usableInFoodJournal)}
                                defaultValue={{label: "Yes", value: true}}
                                onChange={selectedOptions => { handleUsableInFoodJournalChange(selectedOptions) }}
                                styles={{width: "100%"}}
                            />
                        </div>
                        <div className="me-3">
                            <label htmlFor="batchDate" className="form-label">Recipe Batch Date:</label>
                            <div className="input-group">
                                <input type='Date' id="batchDate" name="batchDate" className='form-control' value={foodItemSetup.batchDate} onChange={(e) => handleBatchDateInputChange(e.target.value)} />
                                <button className="btn btn-outline-dark" style={{"border": "1px solid #ced4da"}} type="button" id="button-addon2" onClick={handleBatchDateClearButton}><i className="bi bi-x-circle"></i></button>
                            </div>
                        </div>
                        <div className="me-3">
                            <label htmlFor="Previous Batches" className="form-label">Previous Batches:</label>
                            <Select
                                id="markOthersNotUsableInFoodJournal"
                                options={markOthersOptions}
                                name="markOthersNotUsableInFoodJournal"
                                value={markOthersOptions.filter(opt => opt.value == foodItemSetup.markOthersNotUsableInFoodJournal)}
                                defaultValue={{label: "Mark Not Usable in Food Journal", value: true}}
                                onChange={selectedOptions => { handleMarkOthersNotUsableInFoodJournalChange(selectedOptions) }}
                                styles={{width: "100%"}}
                            />
                        </div>
                    </div>

                    <h6>Actions</h6>

                    <div className="row mb-3">
                        <div className="col-auto align-self-end">
                            <button type="submit" className="btn btn-primary">Create Food Item</button>
                        </div>
                    </div>
                </>
            )}

            <Modal show={modalState.showError}>
                <Modal.Header><h3 className='text-center mb-0 fst-italic'>Oh, No!</h3></Modal.Header>
                <Modal.Body>
                    <div className='fw-bold mb-2'>An unexpected error has occurred.</div>
                    {modalState.errorHttpStatus && (
                        <div className='px-2'>HTTP {modalState.errorHttpStatus}</div>
                    )}
                    {modalState.errorMessage && (
                        <div className='px-2'>
                            <textarea id="error-textarea" disabled="disabled" defaultValue={modalState.errorMessage} style={{fontSize: ".75em", maxHeight: "10em"}} readOnly className='form-control font-monospace'/>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className='text-center'>
                        <button type='button' className='btn btn-primary' onClick={() => { setModalState({...defaultModalState}); }}>OK</button>
                    </div>
                </Modal.Footer>
            </Modal>
        </form>
    );
}

export default RecipeCompute;
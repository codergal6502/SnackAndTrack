import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { fetchGraphQl, displayOrderCompareFn, useUnits, ungroupOptions } from '../utilties';

import Accordion from 'react-bootstrap/Accordion';
import Select from 'react-select';
import Modal from 'react-bootstrap/Modal';

import './RecipeScale.css';
import AccordionItem from 'react-bootstrap/esm/AccordionItem';

// Default or empty state bits
const defaultModalState = { showError: false, errorHttpStatus: null, errorMessage: null };

const RecipeScale = () => {
    // Form and UI State Objects
    const [recipe, setRecipe] = useState({ name: '', source: '', ingredients: [], amountsMade: [] });
    const [scaleSetup, setScaleSetup] = useState({ ingredientId: null, "-ingredientSelection": null, ingredientUnitId: null, ingredientQuantity: "", easyScale: 1 })
    const [scaledRecipe, setScaledRecipe] = useState(null);
    const [modalState, setModalState] = useState(defaultModalState);
    const [ready, setReady] = useState();

    // Lookups and Options
    const [unitDictionary, unitOptions] = useUnits();

    const { id } = useParams();
    const navigate = useNavigate();

    // Loading
    useEffect(() => { document.title = "Snack and Track: Scale Recipe" }, [])

    useEffect(() => {
        if (unitDictionary && unitOptions) {
            setReady(true);
        }
    }, [unitDictionary, unitOptions]);

    useEffect(() => {
        if (ready && id) {
            fetchRecipe(id);
        }
    }, [ready, id]);

    const fetchRecipe = async (id) => {
        const query = `
query ($id: Guid!) {
  recipe(id: $id) {
    id
    name
    notes
    source
    amountsMade {
      id
      quantity
      displayOrder
      unit {
        id
        abbreviationCsv
        name
        type
      }
    }
    recipeIngredients {
      id
      quantity
      displayOrder
      unit {
        id
        abbreviationCsv
        name
        type
      }
      foodItem {
        id
        name
        brand
        servingSizes {
          id
          quantity
          displayOrder
          unit {
            id
            abbreviationCsv
            name
            type
          }
        }
      }
    }
  }
}`;
        const data = await fetchGraphQl(query, { id });
        const recipeEntity = data.recipe;

        const newRecipe = {
            id: recipeEntity.id
          , name: recipeEntity.name
          , notes: recipeEntity.notes
          , source: recipeEntity.source
          , notes: recipeEntity.notes
          , ingredients: (recipeEntity.recipeIngredients ?? []).toSorted(displayOrderCompareFn).map(ri => ({
                foodItemId: ri.foodItem.id
              , foodItemName: ri.foodItem.name
              , quantityUnitId: ri.unit.id
              , quantityUnitName: ri.unit.name
              , quantity: ri.quantity
            }))
          , amountsMade: (recipeEntity.amountsMade ?? []).toSorted(displayOrderCompareFn).map(am => ({
                quantity: am.quantity
              , quantityUnitId: am.unit.id
              , quantityUnitName: am.unit.name
            }))
        };

        setRecipe(newRecipe);

        const newScaleSetup = {
            ingredientId: null
          , ingredientOptions: recipeEntity.recipeIngredients.map(ri => ({
                label: ri.foodItem.name
              , value: ri.foodItem.id
              , "-defaultUnit": ri.unit.id
              , "-unitOptions": unitOptions.filter(grp => ri.foodItem.servingSizes.map(s => s.unit.type).indexOf(grp.label) >= 0)
            }))
        };

        setScaleSetup(newScaleSetup);
    };

    const calculateAndSetScaledRecipe = (unitlessConversionRatio) => {
        const newScaledRecipe = { ingredients: recipe.ingredients.map(ri => ({
            ...ri
          , quantity: unitlessConversionRatio * ri.quantity
          , displayQuantity: unitlessConversionRatio * ri.quantity
          , displayUnitId: ri.quantityUnitId
          , "-recipeUnit": unitDictionary[ri.quantityUnitId]
          , "-unitOptions": unitOptions.filter(grp => grp.label == unitDictionary[ri.quantityUnitId].type)[0].options
        })) };
        setScaledRecipe(newScaledRecipe);
    }

    const handleEasyScaleChange = (scale) => {
        setScaleSetup({...scaleSetup, easyScale: scale});
    }

    const handleEasyScaleGoButton = () => {
        calculateAndSetScaledRecipe(scaleSetup.easyScale);
    }

    const handleIngredientChange = (selectedOption) => {
        const newScaleSetup = {...scaleSetup, ingredientId: selectedOption?.value, "-ingredientSelection": selectedOption, ingredientUnitId: selectedOption?.["-defaultUnit"] };
        setScaleSetup(newScaleSetup)
    }

    const handleIngredientUnitChange = (selectedOption)=> {
        const newScaleSetup = {...scaleSetup, ingredientUnitId: selectedOption?.value, "-ingredientUnitSelection": selectedOption };
        setScaleSetup(newScaleSetup)
    }

    const handleIngredientQuantityChange = (ingredientQuantity) => {
        const newScaleSetup = {...scaleSetup, ingredientQuantity: ingredientQuantity };
        setScaleSetup(newScaleSetup);
    }

    const handleIngredientScaleGoButton = () => {
        console.log(scaleSetup, recipe, unitDictionary);

        const recipeIngredient = recipe.ingredients.filter(ri => ri.foodItemId == scaleSetup.ingredientId)?.[0];
        if (!recipeIngredient) {
            console.error(`Couldn't find recipe ingredient ${scaleSetup?.ingredientId}.`);

            debugger;
            return;
        }

        // A little dimensional analysis. We have the:
        // - recipe food item quantity,
        // - recipe food item unit,
        // - scaled recipe food item quantity
        // - scaled recipe food item unit,
        // - unit conversion ratio.
        // We want the:
        // - unitless conversion ratio 
        
        // rFiQ is the recipe food item quantity.
        // rFiU is the recipe food item unit.
        // sFiQ is the scaled food item quantity.
        // sFiU is the scaled food item unit.
        // urat is the unit conversion ratio.
        const rFiQ = recipeIngredient.quantity;
        const rFiU = recipeIngredient.quantityUnitId;
        const sFiQ = scaleSetup.ingredientQuantity;
        const sFiU = scaleSetup.ingredientUnitId;
        const urat = 
            rFiU == sFiU
          ? 1 // they're literally the same thing!
          : unitDictionary[sFiU].fromUnitConversions.filter(uc => uc.toUnit.id == rFiU)[0]?.ratio;

        if (!urat) {
            console.error(`Couldn't find ratio from ${rFiU} to ${sFiU}}.`);

            debugger;
            return;
        }
        
        // sFiQ (sFiU)   urat (rFiU)        1
        // ----------- • ----------- • -----------
        //                    (sFiU)   rFiQ (rFiU)
        
        const unitlessConversionRatio = sFiQ * urat / rFiQ;

        calculateAndSetScaledRecipe(unitlessConversionRatio);
    }

    const handleScaledRecipeUnitChange = (selectedOption, index) => {
        const oldIngredient = scaledRecipe.ingredients[index]; 
        const ratio = oldIngredient["-recipeUnit"].id == selectedOption.value ? 1 : oldIngredient["-recipeUnit"].fromUnitConversions.filter(c => c.toUnit.id == selectedOption.value)[0].ratio;
        const newIngredient = {
            ... oldIngredient
          , displayUnitId: selectedOption.value
          , displayQuantity: oldIngredient.quantity * ratio
        }

        const newIngredients = [ ...scaledRecipe.ingredients.slice(0, index), newIngredient, ...scaledRecipe.ingredients.slice(index+1)];
        const newScaledRecipe = {...scaledRecipe, ingredients: newIngredients};
        setScaledRecipe(newScaledRecipe);
    }

    return ready && (
        <form autoComplete='Off'>
            <h4>Scale Recipe</h4>
            <div className="row mb-3">
                <label htmlFor="recipe-name" className="col-sm-1 col-form-label">Name:</label>
                <div className="col-sm-4">
                    <input
                        id="recipe-name"
                        type="text"
                        name="name"
                        className="form-control"
                        defaultValue={recipe.name}
                        readOnly
                        disabled
                    />
                </div>
            </div>

            <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Original Recipe</Accordion.Header>
                    <Accordion.Body className='tabular'>
                        <h5 className='m-3'>Amount Made</h5>
                        <table className='table table-striped table-bordered'>
                            <thead>
                                <tr>
                                    <th style={{width:"50%"}} scope="col">Unit</th>
                                    <th style={{width:"50%"}} scope="col">Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(recipe.amountsMade || []).map((amountMade, index) => (
                                    <tr key={index}>
                                        <td>
                                            <label htmlFor={`amountMade-unit-${index}`} className='visually-hidden'>Unit:</label>
                                            <input
                                                id={`amountMade-unit-${index}`}
                                                className={`form-control`}
                                                defaultValue={amountMade.quantityUnitName}
                                                readOnly
                                                disabled
                                            />
                                        </td>
                                        <td>
                                            <label htmlFor={`amountMade-quantity-${index}`} className='visually-hidden'>Quantity:</label>
                                            <input
                                                id={`amountMade-quantity-${index}`}
                                                type="number"
                                                className={`form-control`}
                                                defaultValue={amountMade.quantity}
                                                readOnly
                                                disabled
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>


                        <h5 className='m-3'>Ingredients</h5>
                        <table className='table table-striped table-bordered'>
                            <thead>
                                <tr>
                                    <th style={{width:"33%"}} scope="col">Ingredient</th>
                                    <th style={{width:"33%"}} scope="col">Quantity</th>
                                    <th style={{width:"33%"}} scope="col">Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipe.ingredients.map((ingredient, index) => (
                                    <tr key={index}>
                                        <td className="col">
                                            <label htmlFor={`ingredient-selection-${index}`} className='visually-hidden'>Ingredient:</label>
                                            <input
                                                id={`ingredient-selection-${index}`}
                                                className="form-control"
                                                defaultValue={ingredient.foodItemName}
                                                readOnly
                                                disabled
                                            />
                                        </td>
                                        <td className="col">
                                            <label htmlFor={`ingredient-quantity-${index}`} className='visually-hidden'>Quantity:</label>
                                            <input
                                                id={`ingredient-quantity-${index}`}
                                                type="number"
                                                className="form-control"
                                                defaultValue={ingredient.quantity}
                                                readOnly
                                                disabled
                                            />
                                        </td>
                                        <td className='col'>
                                            <label htmlFor={`ingredient-unit-${index}`} className='visually-hidden'>Unit:</label>
                                            <input
                                                id={`ingredient-selection-${index}`}
                                                className="form-control"
                                                defaultValue={ingredient.quantityUnitName}
                                                readOnly
                                                disabled
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey='1'>
                    <Accordion.Header>Scale by Amount Made</Accordion.Header>
                    <Accordion.Body>
                        <div className="m-3">Enter a number of times to scale the recipe, such as 2.0 or 0.5.</div>
                        <div className="d-flex m-3">
                            <div className="me-3">
                                <label className='form-label' htmlFor="easyScale">Scale:</label>
                                <input
                                    id="easyScale"
                                    name='easyScale'
                                    type="number"
                                    className='form-control'
                                    onChange={e => handleEasyScaleChange(e.target.value)}
                                    defaultValue={1}
                                />
                            </div>
                            <div className="me-3">
                                <label className="form-label">&nbsp;</label>
                                <button type="button" className='btn btn-info form-control' onClick={handleEasyScaleGoButton}>Go</button>
                            </div>
                        </div>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey='2'>
                    <Accordion.Header>Scale by Ingredient Quantity</Accordion.Header>
                    <Accordion.Body>
                        <div className="m-3">Select one of the recipe ingredients and how much of that ingredient you have.</div>
                        <div className="d-flex m-3">
                            <div className="me-3">
                                <label className='form-label' htmlFor="ingredientId">Ingredient:</label>
                                <Select
                                    id="ingredientId"
                                    options={scaleSetup.ingredientOptions}
                                    name="ingredientId"
                                    value={scaleSetup["-ingredientSelection"]}
                                    onChange={selectedOption => handleIngredientChange(selectedOption) }
                                    styles={{width: "100%"}}
                                    isClearable
                                />
                            </div>
                            <div className="me-3">
                                <label className='form-label' htmlFor="ingredientUnitId">Unit:</label>
                                <Select
                                    id="ingredientUnitId"
                                    options={scaleSetup["-ingredientSelection"]?.["-unitOptions"]}
                                    name="ingredientUnitId"
                                    value={scaleSetup["-ingredientUnitSelection"]}
                                    onChange={selectedOption => handleIngredientUnitChange(selectedOption) }
                                    styles={{width: "100%"}}
                                    isClearable
                                />
                            </div>
                            <div className="me-3">
                                <label className='form-label' htmlFor="ingredientQuantity">Quantity:</label>
                                <input
                                    id="ingredientQuantity"
                                    name='ingredientQuantity'
                                    type="number"
                                    className='form-control'
                                    onChange={e => handleIngredientQuantityChange(e.target.value)}
                                    defaultValue={0}
                                />
                            </div>
                            <div className="me-3">
                                <label className="form-label">&nbsp;</label>
                                <button type="button" className='btn btn-info form-control' onClick={handleIngredientScaleGoButton}>Go</button>
                            </div>
                        </div>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item>
                    <Accordion.Header>Scaled Recipe</Accordion.Header>
                    <Accordion.Body>
                        {!scaledRecipe && <div className='m-3'>Please determine a scaling quantity.</div>}
                        {scaledRecipe && <table className='table table-striped table-bordered'>
                            <thead>
                                <tr>
                                    <th>Ingredient</th>
                                    <th>Unit</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scaledRecipe.ingredients.map((si, index) => (
                                    <tr key={index}>
                                        <td><input className="form-control" readOnly disabled defaultValue={si.foodItemName} /></td>
                                        <td><Select
                                            options={si["-unitOptions"]}
                                            value={si["-unitOptions"].filter(opt => opt.value == si.displayUnitId)}
                                            onChange={(selectedOption) => handleScaledRecipeUnitChange(selectedOption, index)}
                                        /></td>
                                        <td><input id={`displayQuantity-${index}`} className="form-control" style={{"width": "4em"}} readOnly disabled value={Math.round(si.displayQuantity*100)/100} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>

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

export default RecipeScale;
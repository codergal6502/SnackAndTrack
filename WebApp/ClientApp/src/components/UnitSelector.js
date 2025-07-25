import React, { userState, useEffect, useState } from 'react';

const UnitSelector = ({ name, onUnitChange, unitType, unitId, idPrefix, idSuffix }) => {
    const [unitTypes, setUnitType] = useState([]);
    const [selectedUnitType, setSelectedUnitType] = useState(unitType || '');
    const [units, setUnits] = useState([]);

    useEffect(() => {
        async function fetchUnitTypes() {
            try {
                const response = await fetch("/api/lookup/unittypes");
                const data = await response.json();
                setUnitType(data);
            }
            catch (err) {
                console.error("Error fetching unit types: ", err);
            }
        };

        fetchUnitTypes();
    }, []);

    useEffect(() => {
        async function fetchUnits() {
            try {
                if (selectedUnitType) {
                    const response = await fetch(`/api/lookup/units/${selectedUnitType}`);
                    const data = await response.json();
                    setUnits(data);
                }
            }
            catch (err) {
                console.error("Error fetching units: ", err);
            }
        };

        fetchUnits();
    }, [selectedUnitType]);
    
    useEffect(() => {
        if (unitType) {
            setSelectedUnitType(unitType);
            async function fetchInitialUnits() {
                try {
                    const response = await fetch(`/api/lookup/units/${unitType}`);
                    const data = await response.json();
                    setUnits(data);
                } catch (err) {
                    console.error("Error fetching initial units: ", err);
                }
            }

            fetchInitialUnits();
        }
    }, [unitType]);
    
    return (
        <>
            <div className="col">
                <label htmlFor={`${idPrefix}unitType${idSuffix}`}>Unit Type:</label>
                <select
                    id={`${idPrefix}unitType${idSuffix}`}
                    value={unitType} 
                    onChange={(e) => setSelectedUnitType(e.target.value)}
                    className="form-select"
                >
                    <option>-</option>
                    {unitTypes.map((unitType) => (
                        <option key={unitType} value={unitType}>{unitType}</option>
                    ))}
                </select>
            </div>
            <div className="col">
                <label htmlFor={`${idPrefix}unitId${idSuffix}`}>Unit:</label>
                <select
                    id={`${idPrefix}unitId${idSuffix}`}
                    value={unitId}
                    onChange={onUnitChange}
                    className="form-select"
                    name={name}
                >
                    <option>-</option>
                    {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.unitName}</option>
                    ))}
                </select>
            </div>
        </>
    );
};

export default UnitSelector;
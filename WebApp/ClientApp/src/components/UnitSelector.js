import React, { userState, useEffect, useState } from 'react';

// <UnitSelector name="unit" onUnitChange={(e) => handleServingSizeChange(index, e)} unitId={servingSize.unitId} />

const UnitSelector = ({ name, onUnitChange, unitId, idPrefix, idSuffix }) => {
    const [unitTypes, setUnitType] = useState([]);
    const [selectedUnitType, setSelectedUnitType] = useState('');
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
                const response = await fetch(`/api/lookup/units/${selectedUnitType}`);
                const data = await response.json();
                setUnits(data);
            }
            catch (err) {
                console.error("Error fetching units: ", err);
            }
        };

        fetchUnits();
    }, [selectedUnitType]);

    return (
        <>
            <div class="col">
                <label for={`${idPrefix}unitType${idSuffix}`}>Unit Type:</label>
                <select
                    id={`${idPrefix}unitType${idSuffix}`}
                    value={selectedUnitType} 
                    onChange={(e) => setSelectedUnitType(e.target.value)}
                    className="form-select"
                >
                    <option>-</option>
                    {unitTypes.map((unitType) => (
                        <option key={unitType} value={unitType}>{unitType}</option>
                    ))}
                </select>
            </div>
            <div class="col">
                <label for={`${idPrefix}unitId${idSuffix}`}>Unit:</label>
                <select
                    id={`${idPrefix}unitId${idSuffix}`}
                    value={unitId}
                    onchange={(e) => onUnitChange(e)}
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
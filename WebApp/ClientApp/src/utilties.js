import { useState, useEffect } from 'react';

const fetchGraphQl = async(query, variables) => {
    let bodyObject = { query };
    if (variables) {
        bodyObject = {... bodyObject, variables };
    }
    const body=JSON.stringify(bodyObject);
    const response = await fetch('/graphql/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body });
    const { data } = await response.json();
    return data;
}

const displayOrderCompareFn = (o1, o2) => o1.displayOrder - o2.displayOrder;

const ungroupOptions = opsArray => opsArray.reduce((acc, cur) => [...acc, ...cur.options], []);

const uniqueFilterFn = (value, index, array) => array.indexOf(value) === index; // https://stackoverflow.com/a/14438954

const fetchUnits = async () => {
    const query = `
    {
      units {
        id
        name
        abbreviationCsv
        type
        canBeFoodQuantity
        fromUnitConversions {
          ratio
          toUnit {
            id
            name
          }
        }
      }
    }`;
    
    try {
        const data = await fetchGraphQl(query);
        const units = data.units;

        const newUnitDct = units.reduce((result, unit) => { 
            result[unit.id] = unit; 
            return result; 
        }, {});

        const groupByType = Object.groupBy(units.filter(u => u.canBeFoodQuantity), u => u.type);
        const unitTypes = Object.keys(groupByType).toSorted((t1, t2) => t1.localeCompare(t2));
        
        const groupedOptions = unitTypes.map(unitType => ({
            label: unitType,
            options: groupByType[unitType].toSorted((u1, u2) => u1.name.localeCompare(u2.name)).map(unit => ({
                value: unit.id,
                label: unit.name,
                unit: unit
            }))
        }));

        return { unitDictionary: newUnitDct, unitOptions: groupedOptions };
    } catch (error) {
        console.error(`Request failed.`, error);
        return { unitDictionary: null, unitOptions: null };
    }
};

const useUnits = () => {
    const [unitDictionary, setUnitDictionary] = useState();
    const [unitOptions, setUnitOptions] = useState();

    useEffect(() => {
        const loadUnits = async () => {
            const { unitDictionary, unitOptions } = await fetchUnits();
            setUnitDictionary(unitDictionary);
            setUnitOptions(unitOptions);
        };

        loadUnits();
    }, []);

    return [unitDictionary, unitOptions];
};

const yesNoOptions = [{ label: "Yes", value: true }, { label: "No", value: false }];

const copyWithoutNullValues = (obj) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null)); // https://stackoverflow.com/a/38340730, modified with !== rather than !=

const objectFromSearchParams = (sp) => {
    let ret = { };
    const spObject = Object.fromEntries(sp);

    for (const key of Object.keys(spObject)) {
        /** @type {String} */ const value = spObject[key];
        if ("true" === value.trim().toLowerCase()) { ret[key] = true; }
        else if ("false" === value.trim().toLowerCase()) { ret[key] = false; }
        else if (parseFloat(value)) { ret[key] = parseFloat(value); }
        else if (parseInt(value)) { ret[key] = parseInt(value); }
        else { ret[key] = value; }
    }

    return ret;
}

export { fetchGraphQl, displayOrderCompareFn, ungroupOptions, uniqueFilterFn, useUnits, yesNoOptions, copyWithoutNullValues, objectFromSearchParams };
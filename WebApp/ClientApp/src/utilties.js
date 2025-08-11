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

const displayOrderCompareFn = (o1, o2) => o2.displayOrder - o1.displayOrder;

const ungroupOptions = opsArray => opsArray.reduce((acc, cur) => [...acc, ...cur.options], []);

export { fetchGraphQl, displayOrderCompareFn, ungroupOptions };
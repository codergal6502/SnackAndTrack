const getJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request to ${url} reponse status is ${response.status}.`);
    }

    return response.json();
}

export { getJson };
export async function getSearchData(searchQuery, searchOption) {
    try {
        let webUrl = import.meta.env.VITE_WEB_URL;
        if (searchOption === "Players") {
            webUrl += "search/players";
        } else {
            webUrl += "search/teams";
        }
        const params = new URLSearchParams();

        if (searchQuery?.trim()) {
            params.set(searchOption === "Players" ? "player" : "team", searchQuery);
        }

        const queryString = params.toString();
        const url = queryString ? `${webUrl}/?${queryString}` : webUrl;

        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await resp.json();
        return data;
    } catch (error) {
        console.error(`Fetch error: ${error}`);
    }
}
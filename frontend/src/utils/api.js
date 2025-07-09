export async function getSearchData(searchQuery = '', searchOption) {
    const opt = searchOption.toLowerCase();
    const q   = searchQuery.trim().toLowerCase();

    try {
        let url = `${import.meta.env.VITE_WEB_URL}${
        opt === 'players' ? 'search/players' : 'search/teams'
        }`;

        if (q) {
            const paramKey = opt === 'players' ? 'player' : 'team';
            url += `?${paramKey}=${encodeURIComponent(q)}`;
        }

        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error(`Fetch failed: ${resp.status}`)
        };
        return await resp.json();
    } catch (err) {
        alert(err);
        return [];
    }
}

export async function fetchPlayerById(id) {
    try {
        const resp = await fetch(`${import.meta.env.VITE_WEB_URL}players/${encodeURIComponent(id)}`);
        if (!resp.ok) {
            throw new Error(`Player ${id} not found`)
        };
        return await resp.json();
    } catch (err) {
        console.error(err)
    }
}

export async function fetchTeamById(id) {
    try {
        const resp = await fetch(`${import.meta.env.VITE_WEB_URL}teams/${encodeURIComponent(id)}`);
        if (!resp.ok) {
            throw new Error(`Team ${id} not found`)
        };
        return await resp.json();
    } catch (err) {
        console.error(err)
    }
}

export async function getPlayerGameData(id, startDate, endDate) {
    try {
        const sd = new Date(startDate).toLocaleDateString("en-US");
        const ed = new Date(endDate).toLocaleDateString("en-US");

        const url = `${import.meta.env.VITE_WEB_URL}player/${id}/games?startDate=${encodeURIComponent(sd)}&endDate=${encodeURIComponent(ed)}`;
        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error(`Cannot access player game log`)
        }
        return await resp.json();
    } catch (err) {
        console.error(err);
    }
}
export async function updateInteractionCounts(interactionType, session) {
    if (!session) {
        console.error("No session available");
        return;
    }

    const accessToken = session.access_token;

    try {
        const resp = await fetch(
            `${import.meta.env.VITE_WEB_URL}interaction/${interactionType}`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!resp.ok) {
            const err = await response.json().catch(() => ({}));
            console.error("Failed to update interaction:", response.status, err);
        }
    } catch (error) {
        console.error("Error updating interaction:", error);
    }
}


export async function getSearchData(searchQuery = '', searchOption) {
    const opt = searchOption.toLowerCase();
    const q  = searchQuery.trim().toLowerCase();

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

export async function getGameData(type, id, startDate, endDate) {
    function formatLocalDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth()+1).padStart(2,'0');
        const d = String(date.getDate())       .padStart(2,'0');
        return `${y}-${m}-${d}`;
    }

    try {
        const sd = formatLocalDate(startDate);
        const ed = formatLocalDate(endDate);

        const url = `${import.meta.env.VITE_WEB_URL}${type}/${id}/games?startDate=${encodeURIComponent(sd)}&endDate=${encodeURIComponent(ed)}`
        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error(`Cannot access ${type === "player" ? "player" : "team"} game log`)
        }
        return await resp.json();
    } catch (err) {
        console.error(err);
    }
}

export async function getPointsPrediction(session, features) {
    const headers = { "Content-Type": "application/json" };

    const token = session?.access_token;
    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }
    
    const params = new URLSearchParams({
        features: JSON.stringify(features)
    });

    const resp = await fetch(`${import.meta.env.VITE_WEB_URL}predict?${params.toString()}`, {
        method: 'GET',
        headers
    });

    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Prediction request failed (${resp.status}): ${text}`);
    }

    const predicted = await resp.json()
    return predicted;
}
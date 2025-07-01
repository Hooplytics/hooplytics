import playersData from '../data/players.json';
import teamsData   from '../data/teams.json';

export async function getSearchData(searchQuery = '', searchOption) {
    const opt = searchOption.toLowerCase();
    const q   = searchQuery.trim().toLowerCase();

    try {
        if (import.meta.env.DEV) {
            const all = opt === 'players' ? playersData : teamsData;
            return all.filter(item =>
                item.name.toLowerCase().includes(q)
            );
        }

        let url = `${import.meta.env.VITE_WEB_URL}${
        opt === 'players' ? '/search/players' : '/search/teams'
        }`;

        if (q) {
            const paramKey = opt === 'players' ? 'player' : 'team';
            url += `?${paramKey}=${encodeURIComponent(q)}`;
        }

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        return await resp.json();
    } catch (err) {
        console.error('getSearchData error:', err);
        return [];
    }
}

export async function fetchPlayerById(id) {
    if (import.meta.env.DEV) {
        // find in local mock
        return playersData.find((p) => p.id === id) ?? null;
    } else {
        // hit your backend endpoint (adjust path if needed)
        const resp = await fetch(
        `${import.meta.env.VITE_WEB_URL}/players/${encodeURIComponent(id)}`
        );
        if (!resp.ok) throw new Error(`Player ${id} not found`);
        return await resp.json();
    }
}

export async function fetchTeamById(id) {
    if (import.meta.env.DEV) {
        return teamsData.find((t) => t.id === id) ?? null;
    } else {
        const resp = await fetch(
        `${import.meta.env.VITE_WEB_URL}/teams/${encodeURIComponent(id)}`
        );
        if (!resp.ok) throw new Error(`Team ${id} not found`);
        return await resp.json();
    }
}
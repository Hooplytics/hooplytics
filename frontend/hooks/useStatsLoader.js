import { useState, useEffect } from "react";
import { getGameData } from "../src/utils/api";

export function useStatsLoader(type, id, startDate, endDate) {
    const [stats, setStats] = useState([])

    useEffect(() => {
        const loadStats = async () => {
            const stats = await getGameData(type, id, startDate, endDate);
            setStats(stats.reverse());
        }

        if (!startDate) return;
        loadStats();
    }, [startDate, endDate])

    return stats
}
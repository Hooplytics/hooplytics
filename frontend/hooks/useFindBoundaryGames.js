import { useState, useEffect } from "react";

export function useFindBoundaryGames(stats, filterOption, filterItem, setStartDate, setEndDate, setFirstGame, setLastGame) {
    const [foundFirst, setFoundFirst] = useState(false);
    const [foundLast, setFoundLast] = useState(false);

    useEffect(() => {
        // trying to get the date of the last game
        // don't want to do this again after finding last game
        // should only run on model load and never again
        if (stats.length > 0 && !foundLast) {
            setFoundLast(true);
            setLastGame(new Date(stats[stats.length - 1].date));
            setEndDate(new Date(stats[stats.length - 1].date));
        }

        // want to find the date of the first game
        // we can only confidently say that we have the first game in our date range if we are querying season data
        if (stats.length > 0 && !foundFirst && (filterOption === "granularity" || filterItem === "season")) {
            setFoundFirst(true);
            setFirstGame(new Date(stats[0].date));
            setStartDate(new Date(stats[0].date));
        }
    }, [stats])
}
import { useState, useEffect } from "react";
import { filterRecency } from "../src/utils/chart";

export function useRecencyFilter(id, filterOption, filterItem, firstGame, lastGame) {
    const [startDate, setStartDate] = useState()
    const [endDate, setEndDate] = useState(lastGame)

    useEffect(() => {
        filterOption === "recency" ? filterRecency(filterItem, firstGame, lastGame, setStartDate, setEndDate): undefined;
    }, [id, filterItem, filterOption])

    return { startDate, endDate, setStartDate, setEndDate }
}
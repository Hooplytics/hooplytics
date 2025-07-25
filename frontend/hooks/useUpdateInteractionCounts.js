import { useState, useEffect } from "react";
import { updateInteractionCounts } from "../src/utils/api"

export function useUpdateInteractionCounts(session, startDate, endDate, filterOption, filterItem, isInsideCanvas, tooltipData) {
    useEffect(() => {
            if (isInsideCanvas) {
                updateInteractionCounts("point", session);
            }
        }, [tooltipData?.date])
    
        // update date interaction count whenever the date range changes or filter option changes
        useEffect(() => {
            // prevent multiple shoots on page load
            const handler = setTimeout(() => {
                if (session && startDate && endDate) {
                    updateInteractionCounts("date", session);
                }
            }, 500);
    
            return () => clearTimeout(handler);
        }, [startDate, endDate, filterOption, filterItem])
}
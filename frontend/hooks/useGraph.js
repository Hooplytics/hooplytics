import { useState, useEffect } from "react";
import { createGraph } from "../src/utils/chart";

export function useGraph(canvasRef, isInsideCanvas, mouseXPosition, hoveredPointRef, stats, firstGame, filterItem, filterOption, graphOption, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct) {
    const [tooltipData, setTooltipData] = useState({})

    useEffect(() => {
        const tooltip = createGraph(canvasRef, isInsideCanvas, mouseXPosition, hoveredPointRef, stats, firstGame, filterItem, filterOption, graphOption, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct);
        // doing this to prevent infinite effect shoots
        if (tooltip !== tooltipData) {
            setTooltipData(tooltip);
        }
    }, [stats, graphOption, filterOption, filterItem, tooltipData])

    return tooltipData
}
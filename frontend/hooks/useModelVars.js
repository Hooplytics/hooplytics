import { useState, useRef } from "react";
import { UserAuth } from "../src/context/AuthContext";

export function useModelVars() {
    const { session } = UserAuth();

    // when tracking which data point we're, we only want to use the x coordinate
    // this makes it easier on the user to not have to hover on each individual point
    const [mouseXPosition, setMouseXPosition] = useState(null);
    const hoveredPointRef = useRef({});
    
    const [graphOption, setGraphOption] = useState("points");
    const [filterOption, setFilterOption] = useState("recency") // recency vs grouping
    const [filterItem, setFilterItem] = useState("month") // which timeline to group or filter by

    const earliestPossibleStart = new Date(Date.UTC(2024, 9, 15, 0, 0, 0));
    const latestPossibleEnd = new Date(Date.UTC(2025, 3, 15, 0, 0, 0));
    const today = new Date();
    
    const [firstGame, setFirstGame] = useState(earliestPossibleStart); // the date of the first game
    const [lastGame, setLastGame] = useState(today <= latestPossibleEnd ? today : latestPossibleEnd); //  the date of the last game
    
    const canvasRef = useRef(null);
    const draggingRef = useRef(false); // helps us determine if we are able to drag (can only drag if we are in a week view)
    const justDraggedRef = useRef(false); // helps us determine if we did drag or if we clicked
    const startXRef = useRef(null);
    const [isInsideCanvas, setIsInsideCanvas] = useState(false);

    return {
        session,
        mouseXPosition, setMouseXPosition,
        hoveredPointRef,
        graphOption, setGraphOption, 
        filterOption, setFilterOption,
        filterItem, setFilterItem,
        firstGame, setFirstGame,
        lastGame, setLastGame,
        canvasRef,
        draggingRef,
        justDraggedRef,
        startXRef,
        isInsideCanvas, setIsInsideCanvas
    }
}
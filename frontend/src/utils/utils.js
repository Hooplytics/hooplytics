import { supabase } from "../supabaseClient";
import { centerWeek, isWeekRange } from "./chart";

const MOUSE_OFFSET = 510 // 520 is the distance of error from the mouse and the points
const DRAG_THRESHOLD = 30 // we want drags to be somewhat significant

// get all favorite teams or players (depending on what is asked for) for a user 
export async function listFavorites(userId, type) {
    const { data, error } = await supabase
    .from("favorites")
    .select("target_id")
    .eq("user_id", userId)
    .eq("target_type", type)
    .order("created_at", { ascending: true });
    if (error) throw error;
    return data.map(r => r.target_id);
}

export async function toggleFavorite(userId, id, type) {
    const { count } = await supabase
    .from("favorites")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("target_id", id)
    .eq("target_type", type);

    if (count === 0) {
        await supabase
            .from("favorites")
            .insert({ user_id: userId, target_id: id, target_type: type });
        return true;  
    }
    return false;
}

export function handleMouseMove(e, setMouseXPosition) {
    setMouseXPosition(e.clientX - MOUSE_OFFSET);
}

export function handleMouseDown(e, startDate, endDate, draggingRef, startXRef, canvasRef) {
    if (isWeekRange(startDate, endDate)) {
        draggingRef.current = true;
        startXRef.current = e.clientX;
        const canvas = canvasRef.current;
        canvas.style.cursor = "grabbing";
    }
}

export function handleMouseUp(e, startXRef, draggingRef, justDraggedRef, canvasRef, startDate, endDate, setStartDate, setEndDate, setFilterItem) {
    const difference = e.clientX - startXRef.current;
    if (difference < -DRAG_THRESHOLD && draggingRef.current) {
        justDraggedRef.current = true; 
        centerWeek(endDate, setStartDate, setEndDate, setFilterItem);
    } else if (difference > DRAG_THRESHOLD && draggingRef.current) {
        justDraggedRef.current = true; 
        centerWeek(startDate, setStartDate, setEndDate, setFilterItem);
    }
    draggingRef.current = false;
    const canvas = canvasRef.current;
    canvas.style.cursor = "default";
}

export function handleCanvasClick(canvasRef, justDraggedRef, hoveredPointRef, setStartDate, setEndDate, setFilterItem) {
    const canvas = canvasRef.current;
    canvas.style.cursor = "default";
    if (justDraggedRef.current) {
        justDraggedRef.current = false;
        return;
    } else {
        if (hoveredPointRef.current?.date) {
            centerWeek(hoveredPointRef.current.date, setStartDate, setEndDate, setFilterItem)
        }
    }
}
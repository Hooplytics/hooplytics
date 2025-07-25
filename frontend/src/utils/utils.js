import { supabase } from "../supabaseClient";

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
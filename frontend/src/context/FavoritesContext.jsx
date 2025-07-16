import { createContext, useContext, useState, useEffect, useRef } from "react";
import { listFavorites, toggleFavorite } from "../utils/utils";
import { fetchPlayerById, fetchTeamById, getGameData } from "../utils/api"
import { UserAuth } from "./AuthContext";

const MILLISECONDS_IN_A_SECOND = 1000;
const SECS_IN_A_HR = 3600;
const HRS_IN_A_DAY = 24;
const DAYS_IN_A_WEEK = 7;
const WEEKS_IN_A_MONTH = 4;

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
    const { session } = UserAuth();
    const user = session?.user;

    const latestPossibleEnd = new Date("2025-04-15");
    const today = new Date();

    const seasonEnd = today <= latestPossibleEnd ? today : latestPossibleEnd;
    const seasonStart = new Date(seasonEnd - (WEEKS_IN_A_MONTH * DAYS_IN_A_WEEK * HRS_IN_A_DAY * SECS_IN_A_HR * MILLISECONDS_IN_A_SECOND));
    
    // store just the ids
    const [favorites, setFavorites] = useState({
        players: [],
        teams: []
    });

    // store entire object and allows us to mutate with rerendering
    const cacheRef = useRef({
        players: {}, 
        teams: {}   
    });

    // uses cached data to rerender when needed
    const [favoriteData, setFavoriteData] = useState({
        players: {},
        teams: {}
    });

    useEffect(() => {
        if (!user?.id) return;
        (async () => {
            const [players, teams] = await Promise.all([
                listFavorites(user.id, "player"),
                listFavorites(user.id, "team"),
            ]);
            setFavorites({ players, teams });
        })();
    }, [user?.id]);

    // get full season data for players on page load and store in memory
    useEffect(() => {
        favorites.players.forEach((id) => {
            if (!cacheRef.current.players[id]) {
                fetchPlayerById(id).then((data) => {
                    cacheRef.current.players[id] = data;
                    setFavoriteData((p) => ({...p, players: { ...cacheRef.current.players }}));
                });
            }

            getGameData("player", id, seasonStart, seasonEnd).catch(console.error);
        });
    }, [favorites.players])

    // get full season data for teams on page load and store in memory
    useEffect(() => {
        favorites.teams.forEach((id) => {
        if (!cacheRef.current.teams[id]) {
            fetchTeamById(id).then((data) => {
                cacheRef.current.teams[id] = data;
                setFavoriteData((p) => ({...p, teams: { ...cacheRef.current.teams }}));
            });
        }

        getGameData("team", id, seasonStart, seasonEnd).catch(console.error);
        });
    }, [favorites.teams]);

    // store full season data for players when favorited
    const toggle = async (id, type) => {
        if (!user?.id) return;
        const nowFav = await toggleFavorite(user.id, id, type);
        const key = type === "player" ? "players" : "teams";

        setFavorites((prev) => ({...prev, [key]: nowFav ? [...prev[key], id] : prev[key].filter((x) => x !== id)}));

        if (nowFav) {
        // load data from Supabase or API
            try {
                await getGameData(type, id, seasonStart, seasonEnd);
            } catch (err) {
                console.error("Failed to fetch full‑season data", err);
            }
        }
        else {
        // if unfavorited, delete from in-memory data
            delete cacheRef.current[key][id];
            setFavoriteData((prev) => ({...prev, [key]: { ...cacheRef.current[key] }}));
        }
    };

    return (
        <FavoritesContext.Provider value={{ favorites, favoriteData, toggle }}>
        {children}
        </FavoritesContext.Provider>
    );
    }

    export function useFavorites() {
    return useContext(FavoritesContext);
}
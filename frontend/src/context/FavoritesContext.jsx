import { createContext, useContext, useState, useEffect, useRef } from "react";
import { listFavorites, toggleFavorite } from "../utils/utils";
import { fetchPlayerById, fetchTeamById } from "../utils/api"
import { UserAuth } from "./AuthContext";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
    const { session } = UserAuth();
    const user = session?.user;
    
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

    useEffect(() => {
        favorites.players.forEach((id) => {
            if (!cacheRef.current.players[id]) {
                fetchPlayerById(id).then((data) => {
                    cacheRef.current.players[id] = data;
                    setFavoriteData((prev) => ({
                        ...prev,
                        players: { ...cacheRef.current.players }
                    }));
                });
            }
        });
    }, [favorites.players]);

    useEffect(() => {
        favorites.teams.forEach((id) => {
            if (!cacheRef.current.teams[id]) {
                fetchTeamById(id).then((data) => {
                    cacheRef.current.teams[id] = data;
                    setFavoriteData((prev) => ({
                        ...prev,
                        teams: { ...cacheRef.current.teams }
                    }));
                });
            }
        });
    }, [favorites.teams]);

    const toggle = async (id, type) => {
        if (!user?.id) return;
        const nowFav = await toggleFavorite(user.id, id, type);
        const key    = type === "player" ? "players" : "teams";

        setFavorites((prev) => ({
        ...prev,
        [key]: nowFav
            ? [...prev[key], id]
            : prev[key].filter((x) => x !== id),
        }));

        if (!nowFav) {
        delete cacheRef.current[key][id];
        setFavoriteData({
            ...favoriteData,
            [key]: { ...cacheRef.current[key] }
        });
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
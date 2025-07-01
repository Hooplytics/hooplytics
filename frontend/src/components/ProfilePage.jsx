import { Link, useLocation, useNavigate } from "react-router-dom"
import { UserAuth } from "../context/AuthContext"
import { useFavorites } from "../context/FavoritesContext";
import { PlayerCard } from "./PlayerCard";
import { TeamCard } from "./TeamCard";

export function ProfilePage() {
    const { pathname } = useLocation();
    const { session, signOut } = UserAuth();
    const navigate = useNavigate();
    const { favorites, favoriteData } = useFavorites();
    const showTeams   = pathname !== "/profile/players";
    const showPlayers = pathname !== "/profile/teams";

    const handleSignOut = async (e) => {
        e.preventDefault();
        try {
            await signOut();
            navigate("/login");
        } catch (error) {
            alert(error);
        }
    }

    const favoritePlayers = favorites.players.map((id) => favoriteData.players[id]).filter(Boolean);
    const favoriteTeams = favorites.teams.map((id) => favoriteData.teams[id]).filter(Boolean);

    return (
        <div>
            <Link to="/home" className="profile-header">
                <header>
                    <h1>Hooplytics</h1>
                </header>
            </Link>
            <div className="profile-grid">
                <div className="profile-info">
                    <img src="profile.webp" className="profile-image"/>
                    <p>{session?.user?.user_metadata?.username ? session?.user?.user_metadata?.username : session?.user?.email}</p>
                    <button onClick={handleSignOut} className="signout">Sign Out</button>
                </div>
                <div className="favorite-nav">
                    <Link to="/profile" className={pathname === "/profile" ? "favorite-tab active" : "favorite-tab"}>All</Link>
                    <Link to="/profile/players" className={pathname === "/profile/players" ? "favorite-tab active" : "favorite-tab"}>Players</Link>
                    <Link to="/profile/teams" className={pathname === "/profile/teams" ? "favorite-tab active" : "favorite-tab"}>Teams</Link>
                </div>
                <div className="favorite-results">
                    {showPlayers && favoritePlayers.map((player) => {
                        return <PlayerCard key={player.id} data={player}/>
                    })}
                    {showTeams && favoriteTeams.map((team) => {
                        return <TeamCard key={team.id} data={team}/>
                    })}
                </div>
            </div>
        </div>
    )
}
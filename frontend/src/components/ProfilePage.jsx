import { Link, useLocation, useNavigate } from "react-router-dom"
import { UserAuth } from "../context/AuthContext"

export function ProfilePage() {
    const { pathname } = useLocation();

    const { session, signOut } = UserAuth();
    const navigate = useNavigate();

    const handleSignOut = async (e) => {
        e.preventDefault();
        try {
            await signOut();
            navigate("/login");
        } catch (error) {
            alert(error);
        }
    }

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
            </div>
        </div>
    )
}
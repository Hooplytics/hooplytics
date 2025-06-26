import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

export function HomePage() {
    const { session, signOut } = UserAuth();

    const [searchOption, setSearchOption] = useState("Players");

    const handleSearchOptionChange = (e) => {
        setSearchOption(prev => e.target.value);
    }

    return (
        <div>
            {session &&
                <div className="home-profile">
                    <Link to="/profile"><img src="/profile.webp" className="home-profile-img" /></Link>
                    <p>{session?.user?.user_metadata?.username ? session?.user?.user_metadata?.username : session?.user?.email}</p>
                </div>}
            {!session &&
                <div className="home-authentication">
                    <Link to="/login" className="auth">Login</Link>
                    <Link to="/signup" className="auth">Signup</Link>
                </div>}
            <Link to="/home" className="header">
                <header>
                    <h1>Hooplytics</h1>
                </header>
            </Link>
            <main>
                <div className="search-container">
                    <select value={searchOption} onChange={handleSearchOptionChange}>
                        <option value="Players">Players</option>
                        <option value="Teams">Teams</option>
                    </select>
                    <input placeholder="Search"/>
                </div>
                <div className="search-results">
                    
                </div>
                </main>
        </div>
    )
}
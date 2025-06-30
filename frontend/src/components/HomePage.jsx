import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { getSearchData } from "../utils/api";
import { SearchDataContainer } from "./SearchDataContainer";

export function HomePage() {
    const { session } = UserAuth();

    const [searchOption, setSearchOption] = useState("Players");
    const [searchQuery, setSearchQuery] = useState("");
    const [displayData, setDisplayData] = useState();

    const getData = async (searchQuery, searchOption) => {
        const data = await getSearchData(searchQuery, searchOption);
        if (data) {
            setDisplayData(data);
        }
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
                    <select value={searchOption} onChange={(e) => setSearchOption(e.target.value)}>
                        <option value="Players">Players</option>
                        <option value="Teams">Teams</option>
                    </select>
                    <form onSubmit={(e) => { e.preventDefault(); getData(searchQuery, searchOption); }}>
                        <input placeholder="Search" onChange={(e) => setSearchQuery(e.target.value)} value={searchQuery} type="text"/>
                    </form>
                </div>
                <SearchDataContainer/>
            </main>
        </div>
    )
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { getSearchData, updateInteractionCounts } from "../utils/api";
import { SearchContainer } from "./SearchContainer";
import { Loader } from "./Loader";

export function HomePage() {
    const { session } = UserAuth();

    const [searchOption, setSearchOption] = useState("Players");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterOption, setFilterOption] = useState("");
    const [displayData, setDisplayData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);

    const getData = async (searchQuery, searchOption) => {
        setLoading(true);
        const data = await getSearchData(searchQuery, searchOption);
        if (data) {
            setDisplayData(data);
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!searchQuery) {
            setDisplayData([]);
        }
    }, [searchQuery])

    useEffect(() => {
        if (filterOption) {
            updateInteractionCounts("position", session);
        }
        
        if (filterOption !== "") {
            const filteredPlayers = displayData.filter(player => {
                return player.position === filterOption;
            })
            setFilteredData(filteredPlayers);
        }
    }, [filterOption])

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
                    <select value={searchOption} onChange={(e) => { setSearchOption(e.target.value); setDisplayData([]); setSearchQuery(""); }}>
                        <option value="Players">Players</option>
                        <option value="Teams">Teams</option>
                    </select>
                    <form onSubmit={(e) => { e.preventDefault(); getData(searchQuery, searchOption); }}>
                        <input placeholder="Search" onChange={(e) => setSearchQuery(e.target.value)} value={searchQuery} type="text"/>
                    </form>
                    {searchOption === "Players" && <select className="position-filter" onChange={(e) => setFilterOption(e.target.value)}>
                        <option value="" default>All Positions</option>
                        <option value="Guard">Guard</option>
                        <option value="Guard-Forward">Guard-Forward</option>
                        <option value="Forward-Guard">Forward-Guard</option>
                        <option value="Forward">Forward</option>
                        <option value="Forward-Center">Forward-Center</option>
                        <option value="Center-Forward">Center-Forward</option>
                        <option value="Center">Center</option>
                    </select>}
                </div>
                <SearchContainer option={ searchOption } data={filterOption === "" ? displayData : filteredData}/>
            </main>
            {loading && <Loader/>}
        </div>
    )
}
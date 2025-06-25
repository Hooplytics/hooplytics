import { useState } from "react";
import { Link } from "react-router-dom";

export function HomePage() {
    const [searchOption, setSearchOption] = useState("Players");

    return (
        <div>
            <Link to="/home" className="header">
                <header>
                    <h1>Hooplytics</h1>
                </header>
            </Link>
            <main>
                    <div className="search-container">
                        <select>
                            <option value="Players">Players</option>
                            <option value="Teams">Teams</option>
                        </select>
                        <input placeholder="Search"/>
                    </div>
                </main>
        </div>
    )
}
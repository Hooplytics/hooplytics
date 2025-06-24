import { useState } from "react";
import { Link } from "react-router-dom";

export function HomePage() {
    const [searchOption, setSearchOption] = useState("Players");

    return (
        <div>
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
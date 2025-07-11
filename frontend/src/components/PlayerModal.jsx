import { useEffect, useState, useRef } from "react"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../App.css"
import { getPlayerGameData } from "../utils/api"
import { Tooltip } from "./Tooltip"
import { filterRecency, createGraph } from "../utils/chart";

export function PlayerModal({ onClose, data, isFav, toggleFav }) {
    const { id, image_url, name, team, position, age, height, weight, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct } = data;

    const [graphOption, setGraphOption] = useState("points");
    const [playerStats, setPlayerStats] = useState([]);
    const [filterOption, setFilterOption] = useState("recency") // recency vs grouping
    const [filterItem, setFilterItem] = useState("season") // which timeline to group or filter by

    const [startDate, setStartDate] = useState(new Date("2024-10-02")); // the beginning date for the range to query
    const [endDate, setEndDate] = useState(new Date("2025-07-01")); // the ending date for the range to query
    const [firstGame, setFirstGame] = useState(new Date("2024-10-02")); // the date of the first game
    const [lastGame, setLastGame] = useState(new Date("2025-07-01")); //  the date of the last game

    const canvasRef = useRef(null);

    useEffect(() => {
        const setDates = async () => {
            const stats = await getPlayerGameData(id, startDate, endDate);
            const dates = stats.reverse().map(game => new Date(game.date));
            setFirstGame(dates[0]);
            setLastGame(dates[dates.length - 1]);
            setStartDate(dates[0]);
            setEndDate(dates[dates.length - 1]);
        }
        setDates();
    }, [id])
    
    useEffect(() => {
        const loadStats = async () => {
            const stats = await getPlayerGameData(id, startDate, endDate);
            setPlayerStats(stats.reverse());
        }
        loadStats();
    }, [startDate, endDate])
    
    useEffect(() => {
        createGraph(canvasRef, playerStats, firstGame, filterItem, filterOption, graphOption, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct);
    }, [playerStats, graphOption, filterOption, filterItem])

    useEffect(() => {
        filterOption === "recency" ? filterRecency(filterItem, firstGame, lastGame, setStartDate, setEndDate): undefined;
    }, [filterItem, filterOption])

    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal-content" onClick={(e) => e.stopPropagation}>
                <p className="close-modal" onClick={onClose}>&times;</p>
                <img className="modal-heart" src={isFav ? "/heart.png" : "empty-heart.png"} onClick={toggleFav} />
                <div className="player-header">
                    <img src={image_url} />
                    <div className="player-info">
                        <div className="player-metrics">
                            <h3>{name} | {team} </h3>
                            <h6>{position}</h6>
                            <h6><strong>Age:</strong> {age}</h6>
                            <h6><strong>Height:</strong> {height}</h6>
                            <h6><strong>Weight:</strong> {weight} lbs</h6>
                        </div>
                        <div className="player-stats">
                            <div className="player-stats-column">
                                <Tooltip text="Points per game"><p>PTS: {pts.toFixed(1)}</p></Tooltip>
                                <Tooltip text="Assists per game"><p>AST: {ast.toFixed(1)}</p></Tooltip>
                                <Tooltip text="Rebounds per game"><p>REB: {reb.toFixed(1)}</p></Tooltip>
                            </div>
                            <div className="player-stats-column">
                                <Tooltip text="Blocks per game"><p>BLK: {blk.toFixed(1)}</p></Tooltip>
                                <Tooltip text="Steals per game"><p>STL: {stl.toFixed(1)}</p></Tooltip>
                                <Tooltip text="Turnovers per game"><p>TOV: {tov.toFixed(1)}</p></Tooltip>
                            </div>
                            <div className="player-stats-column">
                                <Tooltip text="Average field goal percentage"><p>FG%: {fg_pct.toFixed(1)}%</p></Tooltip>
                                <Tooltip text="Average 3-point percentage"><p>3P%: {fg3_pct.toFixed(1)}%</p></Tooltip>
                            </div>
                            </div>
                    </div>
                    </div>
                <div className="chart-wrapper">
                    <select className="graph-select"onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setGraphOption(e.target.value);
                    }}>
                        <option value="points">Points</option>
                        <option value="assists">Assists</option>
                        <option value="rebounds">Rebounds</option>
                        <option value="blocks">Blocks</option>
                        <option value="steals">Steals</option>
                        <option value="turnovers">Turnovers</option>
                        <option value="fg_pct">Field Goal %</option>
                        <option value="3pt_pct">3pt %</option>
                    </select>
                    <canvas ref={canvasRef} width={800} height={450} id="canvas" />
                </div>
                <div className="graph-filter-by">
                    <select className="filter" onChange={(e) => {
                        e.preventDefault();
                        setFilterOption(e.target.value);
                        if (e.target.value === "granularity") {
                            setStartDate(firstGame);
                            setEndDate(lastGame);
                            if (filterItem === "season") setFilterItem("month");
                        }
                    }}>
                        <option default value="recency">Recency</option>
                        <option value="granularity" >Granularity</option>
                    </select>
                    <select className="filter" onChange={(e) => {
                            e.preventDefault();
                            setFilterItem(e.target.value);
                        }}>
                        {filterOption === "recency" && <option default value="season">Full Season</option>}
                        <option value="month">{ filterOption === "recency" ? "Last Month" : "Monthly" }</option>
                        <option value="week">{ filterOption === "recency" ? "Last Week" : "Weekly" }</option>
                    </select>
                    {startDate && endDate && filterOption === "recency" && <div className="custom-dates">
                        <span>
                            <p>Start Date: </p>
                            <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} placeholderText="Select a start date" minDate={firstGame} maxDate={lastGame} dateFormat="MMMM dd, yyyy"/>
                        </span>
                        <span>
                            <p>End Date: </p>
                            <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} placeholderText="Select a end date" minDate={startDate || firstGame} maxDate={lastGame} dateFormat="MMMM dd, yyyy" />
                        </span>
                    </div>}
                </div>
            </div>
        </div>
    )
}
import { useEffect, useState, useRef, use } from "react"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../App.css"
import { getGameData, getPointsPrediction } from "../utils/api"
import { Tooltip } from "./Tooltip"
import { filterRecency, createGraph } from "../utils/chart";

export function PlayerModal({ onClose, data, isFav, toggleFav }) {
    const { id, image_url, name, team, position, age, height, weight, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct } = data;

    const earliestPossibleStart = new Date(Date.UTC(2024, 9, 15, 0, 0, 0));
    const latestPossibleEnd = new Date(Date.UTC(2025, 3, 15, 0, 0, 0));
    const today = new Date();

    const [graphOption, setGraphOption] = useState("points");
    const [playerStats, setPlayerStats] = useState([]);
    const [filterOption, setFilterOption] = useState("recency") // recency vs grouping
    const [filterItem, setFilterItem] = useState("month") // which timeline to group or filter by

    const [startDate, setStartDate] = useState(); // the beginning date for the range to query
    const [endDate, setEndDate] = useState(today <= latestPossibleEnd ? today : latestPossibleEnd); // the ending date for the range to query
    const [firstGame, setFirstGame] = useState(earliestPossibleStart); // the date of the first game (setting as state otherwise value won't save)
    const [lastGame, setLastGame] = useState(today <= latestPossibleEnd ? today : latestPossibleEnd); //  the date of the last game (setting as state otherwise value won't save)
    const [foundFirst, setFoundFirst] = useState(false);
    const [foundLast, setFoundLast] = useState(false);
    const [calculatedFeatures, setCalculatedFeatures] = useState(false); // (setting as state otherwise value won't save)
    const [predictedPoints, setPredictedPoints] = useState(null); // (setting as state otherwise value won't save)

    const canvasRef = useRef(null);

    // features dict that I will use to predict scores
    const [features, setFeatures] = useState({
        "home": false,
        "guard": position == "Guard",
        "center": position == "Center",
        "forward": position == "Forward",
        "restDays": 3,
        "season_end": [3, 4].includes(lastGame.getMonth()) ,
        "last7GameAvg": 0,
        "season_begin": [9, 10].includes(lastGame.getMonth()),
        "forward_guard": position == "Forward-Guard",
        "guard_forward": position == "Guard-Forward",
        "seasonAverage": pts,
        "season_middle": [11, 0, 1].includes(lastGame.getMonth()),
        "center_forward": position == "Center-Forward",
        "forward_center": position == "Forward-Center",
        "opponentPointsAllowed": 0
    })

    const updateFeature = (key, value) => {
        setFeatures(prev => (
            { ...prev, [key]: value }
        ));
    }    

    const getOpponentPointsAllowed = () => {
        const scores = [119.3, 112.4, 119.3, 119.4, 115.4, 110.5, 108.2, 112.2, 110.0, 113.0, 109.3, 105.5, 115.1, 115.8, 113.9, 115.3, 116.7, 107.6, 115.2, 121.2, 120.4, 114.2];
        const randomIndex = Math.floor(Math.random() * scores.length);
        updateFeature("opponentPointsAllowed", scores[randomIndex]);
    }

    const getLast7GameAvg = () => {
        // non‐mutating: pull the last up to 7 games
        const lastSeven = playerStats.slice(-7);

        // sum their pts fields
        let sum = 0;
        for (let i = 0; i < lastSeven.length; ++i) {
            sum += lastSeven[i].points;
        }
        const average = sum / lastSeven.length
        updateFeature("last7GameAvg", Number(average.toFixed(2)));
    }

    const getPredictedPoints = async () => { 
        const points = await getPointsPrediction(features);
        setPredictedPoints(points);
    }

    useEffect(() => {
        filterOption === "recency" ? filterRecency(filterItem, firstGame, lastGame, setStartDate, setEndDate): undefined;
    }, [id, filterItem, filterOption])
    
    useEffect(() => {
        const loadStats = async () => {
            const stats = await getGameData("player", id, startDate, endDate);
            setPlayerStats(stats.reverse());
        }
        if (!startDate) return;
        loadStats();
    }, [startDate, endDate])
    
    useEffect(() => {
        createGraph(canvasRef, playerStats, firstGame, filterItem, filterOption, graphOption, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct);
        if (playerStats.length > 0 && !foundLast) {
            setFoundLast(true);
            setLastGame(new Date(playerStats[playerStats.length - 1].date));
            setEndDate(new Date(playerStats[playerStats.length - 1].date));
        }
    }, [playerStats, graphOption, filterOption, filterItem])

    useEffect(() => {
        if (playerStats.length > 0 && !foundFirst && (filterOption === "granularity" || filterItem === "season")) {
            setFoundFirst(true);
            setFirstGame(new Date(playerStats[0].date));
            setStartDate(new Date(playerStats[0].date));
        }
        if (playerStats.length > 0 && !calculatedFeatures) {
            getLast7GameAvg();
            getOpponentPointsAllowed();
            setCalculatedFeatures(true);
        }
    }, [playerStats])

    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                <button onClick={getPredictedPoints}>Predict next game points</button>
                {calculatedFeatures && predictedPoints && <p>Predicted points for next game: {predictedPoints}</p>}
                <div className="chart-wrapper">
                    <select className="graph-select" onChange={(e) => {
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
                    <select className="filter" value={filterItem} onChange={(e) => {
                            e.preventDefault();
                            setFilterItem(e.target.value);
                        }}>
                        {filterOption === "recency" && <option value="season">Full Season</option>}
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
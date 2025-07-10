import { useEffect, useState, useRef } from "react"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../App.css"
import { getPlayerGameData } from "../utils/api"
import { Tooltip } from "./Tooltip"

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

    const MARGIN_TR = 20; // margin for top and right
    const MARGIN_BL = 40; // margin for bottom and left

    const filterRecency = () => {
        const today = lastGame;
        let lastDate;
        if (filterItem === "season") {
            setStartDate(firstGame);
            setEndDate(lastGame);
        } else if (filterItem === "week") {
            lastDate = new Date(today.getTime() - (6 * 24 * 60 * 60 * 1000));
            setStartDate(lastDate);
            setEndDate(today);
        } else if (filterItem === "month") {
            lastDate = new Date(today.getTime() - (4 * 7 * 24 * 60 * 60 * 1000));
            setStartDate(lastDate);
            setEndDate(today);
        }
    }

    const monthlyGranularity = () => {
        const stats = playerStats.map(game => game[graphOption]);
        const dates = playerStats.map(game => new Date(game.date));

        const granulatedStats = [];
        let currMonthStats = 0;
        let currMonthGames = 0;

        let currMonth = firstGame.getMonth();
        let currYear = firstGame.getFullYear();

        let startMonth = new Date(currYear, currMonth, 1);
        let endMonth = new Date(currYear, currMonth + 1, 0);
        
        for (let i = 0; i < stats.length; ++i) {
            if (dates[i] >= startMonth && dates[i] <= endMonth) {
                currMonthStats += stats[i];
                ++currMonthGames;
            }
            if (i === stats.length - 1 || dates[i + 1] > endMonth) {
                granulatedStats.push(currMonthStats / currMonthGames);
                currMonthGames = 0;
                currMonthStats = 0;
            } 
            if (i !== stats.length - 1) {
                currMonth = dates[i + 1].getMonth();
                currYear = dates[i + 1].getFullYear();
                startMonth = new Date(currYear, currMonth, 1);
                endMonth = new Date(currYear, currMonth + 1, 0);
            }
        }
        return granulatedStats;
    }

    const weeklyGranularity = () => {
        const stats = playerStats.map(game => game[graphOption]);
        const dates = playerStats.map(game => new Date(game.date));

        const granulatedStats = [];
        let currWeekStats = 0;
        let currWeekGames = 0;

        let startWeek = firstGame;
        let endWeek = new Date(startWeek.getTime() + (6 * 24 * 60 * 60 * 1000));
        
        for (let i = 0; i < stats.length; ++i) {
            if (dates[i] >= startWeek && dates[i] <= endWeek) {
                currWeekStats += stats[i];
                ++currWeekGames;
            }
            if (i === stats.length - 1 || dates[i + 1] > endWeek) {
                granulatedStats.push(currWeekStats / currWeekGames);
                currWeekGames = 0;
                currWeekStats = 0;
            }
            if (i !== stats.length - 1 && dates[i + 1] >= endWeek) {
                do {
                    startWeek = new Date(endWeek.getTime() + (24 * 60 * 60 * 1000));
                    endWeek = new Date(startWeek.getTime() + (6 * 24 * 60 * 60 * 1000));
                } while (dates[i + 1] > endWeek);
            }
        }
        return granulatedStats;
    }

    const createGraph = () => {
        let stats;
        if (filterOption === "recency") {
            stats = playerStats.map(game => game[graphOption]);
        } else {
            stats = filterItem === "week" ? weeklyGranularity() : monthlyGranularity();
        }

        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        const containerHeight = canvas.height;
        const containerWidth = canvas.width;
        context.clearRect(0, 0, containerWidth, containerHeight)

        const height = containerHeight - MARGIN_TR - MARGIN_BL;
        const width = containerWidth - MARGIN_TR - MARGIN_BL;
        const xScale = width / (stats.length - 1)
        
        const maxY = Math.max(...stats);
        const yScale = height / maxY;

        context.save()
        context.translate(MARGIN_BL, MARGIN_TR)

        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, height);
        context.lineTo(width, height);
        context.stroke();
        context.closePath();
        
        let lastX = 0;
        let lastY = 0;
        context.beginPath();
        stats.forEach((stat, index) => {
            const x = xScale * index;
            const y = height - (stat * yScale)
            if (index === 0) {
                context.moveTo(lastX, y);
            } else {
                context.moveTo(lastX, lastY);
            }
            context.lineTo(x, y);
            context.arc(x, y, 2, 0, 2 * Math.PI);
            lastX = x;
            lastY = y;
        });

        context.strokeStyle = "#007bff";
        context.lineWidth = 2;
        context.stroke();

        context.beginPath();
        let statAverage;
        switch (graphOption) {
            case "points":
                statAverage = pts;
                break;
            case "assists":
                statAverage = ast;
                break;
            case "rebounds":
                statAverage = reb;
                break;
            case "blocks":
                statAverage = blk;
                break;
            case "steals":
                statAverage = stl;
                break;
            case "turnovers":
                statAverage = tov;
                break;
            case "fg_pct":
                statAverage = fg_pct;
                break;
            case "3pt_pct":
                statAverage = fg3_pct;
                break;
        }
        context.moveTo(0, height - (statAverage * yScale));
        context.lineTo(width, height - (statAverage * yScale));
        context.strokeStyle = "#FF0000";
        context.lineWidth = 2;
        context.stroke();

        context.font = "16px Arial";
        context.fillStyle = "white";
        context.fillText(0, -25, height + 5);
        context.fillText((maxY / 4).toFixed(1), -37, (height / 4) * 3 + 5);
        context.fillText((maxY / 2).toFixed(1), -37, (height / 4) * 2 + 5);
        context.fillText((maxY / 4 * 3).toFixed(1), -37, height / 4 + 5);
        context.fillText(maxY.toFixed(1), -37, 10);
    
        context.restore();
    }

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
        createGraph();
    }, [playerStats, graphOption, filterOption, filterItem])

    useEffect(() => {
        filterOption === "recency" ? filterRecency(): undefined;
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
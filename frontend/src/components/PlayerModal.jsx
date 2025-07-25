import { useEffect, useState, useRef } from "react"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../App.css"
import { UserAuth } from "../context/AuthContext"
import { getGameData, getPointsPrediction, updateInteractionCounts} from "../utils/api"
import { Tooltip } from "./Tooltip"
import { filterRecency, createGraph, centerWeek, isWeekRange } from "../utils/chart";
import { Loader } from "./Loader";

const MOUSE_OFFSET = 510 // 520 is the distance of error from the mouse and the points
const DRAG_THRESHOLD = 30 // we want drags to be somewhat significant

export function PlayerModal({ onClose, data, isFav, toggleFav }) {
    const { id, image_url, name, team, position, age, height, weight, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct } = data;

    const { session } = UserAuth();

    // when tracking which data point we're, we only want to use the x coordinate
    // this makes it easier on the user to not have to hover on each individual point
    const [mouseXPosition, setMouseXPosition] = useState(null);
    const hoveredPointRef = useRef({});

    const [loading, setLoading] = useState(false);

    const [graphOption, setGraphOption] = useState("points");
    const [playerStats, setPlayerStats] = useState([]);
    const [filterOption, setFilterOption] = useState("recency") // recency vs grouping
    const [filterItem, setFilterItem] = useState("month") // which timeline to group or filter by

    const earliestPossibleStart = new Date(Date.UTC(2024, 9, 15, 0, 0, 0));
    const latestPossibleEnd = new Date(Date.UTC(2025, 3, 15, 0, 0, 0));
    const today = new Date();

    const [startDate, setStartDate] = useState(); // the beginning date for the range to query
    const [endDate, setEndDate] = useState(today <= latestPossibleEnd ? today : latestPossibleEnd); // the ending date for the range to query
    const [firstGame, setFirstGame] = useState(earliestPossibleStart); // the date of the first game (setting as state otherwise value won't save)
    const [lastGame, setLastGame] = useState(today <= latestPossibleEnd ? today : latestPossibleEnd); //  the date of the last game (setting as state otherwise value won't save)
    const [foundFirst, setFoundFirst] = useState(false);
    const [foundLast, setFoundLast] = useState(false);
    const [calculatedFeatures, setCalculatedFeatures] = useState(false); // (setting as state otherwise value won't save)
    const [predictedPoints, setPredictedPoints] = useState(null); // (setting as state otherwise value won't save)

    const canvasRef = useRef(null);
    const draggingRef = useRef(false); // helps us determine if we are able to drag (can only drag if we are in a week view)
    const justDraggedRef = useRef(false); // helps us determine if we did drag or if we clicked
    const startXRef = useRef(null);
    const [isInsideCanvas, setIsInsideCanvas] = useState(false);

    const [tooltipData, setTooltipData] = useState({}); // data to be shown on graph for tooltip
    // doing this so that the tooltip position adjusts to where the data point is
    const GRAPH_TOOLTIP = <div className="canvas-tooltip" style={{
                                position: "absolute",
                                left: tooltipData?.x + 330 || null,
                                top: tooltipData?.y + 60 || null,
                                background: "#222",
                                color: "#fff",
                                padding: "7px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                zIndex: 5
                            }}>
                            <div><strong>Date:</strong> {tooltipData.date}</div>
                            <div><strong>{graphOption}:</strong> {tooltipData?.value?.toFixed(0)}</div>
                        </div>

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
        // pull the last up to 7 games
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
        setLoading(true)
        const points = await getPointsPrediction(session, features);
        setPredictedPoints(points);
        setLoading(false);
        updateInteractionCounts("point", session);
    }

    const handleMouseMove = (e) => {
        setMouseXPosition(e.clientX - MOUSE_OFFSET);
    }

    const handleMouseDown = (e) => {
        if (isWeekRange(startDate, endDate)) {
            draggingRef.current = true;
            startXRef.current = e.clientX;
            const canvas = canvasRef.current;
            canvas.style.cursor = "grabbing";
        }
    }

    const handleMouseUp = (e) => {
        const difference = e.clientX - startXRef.current;
        if (difference < -DRAG_THRESHOLD && draggingRef.current) {
            justDraggedRef.current = true; 
            centerWeek(endDate, setStartDate, setEndDate, setFilterItem);
        } else if (difference > DRAG_THRESHOLD && draggingRef.current) {
            justDraggedRef.current = true; 
            centerWeek(startDate, setStartDate, setEndDate, setFilterItem);
        }
        draggingRef.current = false;
        const canvas = canvasRef.current;
        canvas.style.cursor = "default";
    }

    const handleCanvasClick = () => {
        const canvas = canvasRef.current;
        canvas.style.cursor = "default";
        if (justDraggedRef.current) {
            justDraggedRef.current = false;
            return;
        } else {
            if (hoveredPointRef.current?.date) {
                centerWeek(hoveredPointRef.current.date, setStartDate, setEndDate, setFilterItem)
            }
        }
    }

    // effect for changing recency
    // want this to run on model load and shoot anytime the recency item changes or the filter option changes
    useEffect(() => {
        filterOption === "recency" ? filterRecency(filterItem, firstGame, lastGame, setStartDate, setEndDate): undefined;
    }, [id, filterItem, filterOption])
    
    // only want to load new stats whenever the date range changes
    useEffect(() => {
        const loadStats = async () => {
            const stats = await getGameData("player", id, startDate, endDate);
            setPlayerStats(stats.reverse());
        }
        if (!startDate) return;
        loadStats();
    }, [startDate, endDate])
    
    // changing what the graph looks like either when the date range changes, the filter option changes, or the tool tip data changes (for tooltip and hover animation)
    // not using mouse position because mouse can change infinitesmely but not change the hovered point
    useEffect(() => {
        const tooltip = createGraph(canvasRef, isInsideCanvas, mouseXPosition, hoveredPointRef, playerStats, firstGame, filterItem, filterOption, graphOption, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct);
        // doing this to prevent infinite effect shoots
        if (tooltip !== tooltipData) {
            setTooltipData(tooltip);
        }
        // trying to get the date of the last game
        // don't want to do this again after finding last game
        // should only run on model load and never again
        if (playerStats.length > 0 && !foundLast) {
            setFoundLast(true);
            setLastGame(new Date(playerStats[playerStats.length - 1].date));
            setEndDate(new Date(playerStats[playerStats.length - 1].date));
        }
    }, [playerStats, graphOption, filterOption, filterItem, tooltipData])

    useEffect(() => {
        // want to find the date of the first game
        // we can only confidently say that we have the first game in our date range if we are querying season data
        if (playerStats.length > 0 && !foundFirst && (filterOption === "granularity" || filterItem === "season")) {
            setFoundFirst(true);
            setFirstGame(new Date(playerStats[0].date));
            setStartDate(new Date(playerStats[0].date));
        }

        // want to get values to use for prediction model
        // should only run on model load
        if (playerStats.length > 0 && !calculatedFeatures) {
            getLast7GameAvg();
            getOpponentPointsAllowed();
            setCalculatedFeatures(true);
        }
    }, [playerStats])

    // only want to update if we are hovering inside of the graph
    // updates on point hover change
    useEffect(() => {
        if (isInsideCanvas) {
            updateInteractionCounts("point", session);
        }
    }, [tooltipData?.date])

    // update date interaction count whenever the date range changes or filter option changes
    useEffect(() => {
        // prevent multiple shoots on page load
        const handler = setTimeout(() => {
            if (session && startDate && endDate) {
                updateInteractionCounts("date", session);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [startDate, endDate, filterOption])

    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} onMouseMove={handleMouseMove}>
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
                <div className="predicted-points">
                    <button onClick={getPredictedPoints}>Predict next game points</button>
                    {calculatedFeatures && predictedPoints && <p>Predicted points for next game: <strong>{predictedPoints}</strong></p>}
                </div>
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
                    <canvas ref={canvasRef} width={800} height={450} onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} id="canvas" onClick={() => handleCanvasClick()} onMouseEnter={() => setIsInsideCanvas(true)} onMouseLeave={() => setIsInsideCanvas(false)}/>
                    {isInsideCanvas && tooltipData.show && GRAPH_TOOLTIP}
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
                        <option value="week">{filterOption === "recency" ? "Last Week" : "Weekly"}</option>
                        {filterOption === "recency" && <option value="custom">Custom</option>}
                    </select>
                    {startDate && endDate && filterOption === "recency" && <div className="custom-dates">
                        <span>
                            <p>Start Date: </p>
                            <DatePicker selected={startDate} onChange={(date) => { setStartDate(date); setFilterItem("custom")}} placeholderText="Select a start date" minDate={firstGame} maxDate={lastGame} dateFormat="MMMM dd, yyyy"/>
                        </span>
                        <span>
                            <p>End Date: </p>
                            <DatePicker selected={endDate} onChange={(date) => { setEndDate(date);  setFilterItem("custom")}} placeholderText="Select a end date" minDate={startDate || firstGame} maxDate={lastGame} dateFormat="MMMM dd, yyyy" />
                        </span>
                    </div>}
                </div>
                {loading && <Loader/>}
            </div>
        </div>
    )
}
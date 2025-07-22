import { useEffect, useState, useRef } from "react"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../App.css"
import { getGameData } from "../utils/api"
import { Tooltip } from "./Tooltip"
import { filterRecency, createGraph, centerWeek, isWeekRange } from "../utils/chart";

const MOUSE_OFFSET = 510 // 520 is the distance of error from the mouse and the points
const DRAG_THRESHOLD = 30 // we want drags to be somewhat significant

const GRAPH_TOOLTIP = <div className="canvas-tooltip" style={{
                                position: "absolute",
                                left: tooltipData.x + 330,
                                top: tooltipData.y + 60,
                                background: "#222",
                                color: "#fff",
                                padding: "7px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                zIndex: 5
                            }}>
                            <div><strong>Date:</strong> {tooltipData.date}</div>
                            <div><strong>{graphOption}:</strong> {tooltipData.value.toFixed(0)}</div>
                        </div>

export function TeamModal({ onClose, data, isFav, toggleFav }) {
    const { id, logo_url, name, record, pts, pts_rank, ast, ast_rank, reb, reb_rank, oreb, oreb_rank, blk, blk_rank, stl, stl_rank, tov, tov_rank, fg_pct, fg_pct_rank, fg3_pct, fg3_pct_rank, oppg, oppg_rank, opp_reb, opp_reb_rank, opp_oreb, opp_oreb_rank, opp_tov, opp_tov_rank, opp_fg_pct, opp_fg_pct_rank, opp_fg3_pct, opp_fg3_pct_rank } = data;
    
    // when tracking which data point we're, we only want to use the x coordinate
    // this makes it easier on the user to not have to hover on each individual point
    const [mouseXPosition, setMouseXPosition] = useState(null);
    const hoveredPointRef = useRef({});
    
    const [graphOption, setGraphOption] = useState("points");
    const [teamStats, setTeamStats] = useState([]);
    const [filterOption, setFilterOption] = useState("recency") // recency vs grouping
    const [filterItem, setFilterItem] = useState("month") // which timeline to group or filter by

    const earliestPossibleStart = new Date(Date.UTC(2024, 9, 15, 0, 0, 0));
    const latestPossibleEnd = new Date(Date.UTC(2025, 3, 15, 0, 0, 0));
    const today = new Date();
    
    const [startDate, setStartDate] = useState(); // the beginning date for the range to query
    const [endDate, setEndDate] = useState(today <= latestPossibleEnd ? today : latestPossibleEnd); // the ending date for the range to query
    const [firstGame, setFirstGame] = useState(earliestPossibleStart); // the date of the first game
    const [lastGame, setLastGame] = useState(today <= latestPossibleEnd ? today : latestPossibleEnd); //  the date of the last game
    const [foundFirst, setFoundFirst] = useState(false);
    const [foundLast, setFoundLast] = useState(false);
    
    const canvasRef = useRef(null);
    const draggingRef = useRef(false); // helps us determine if we are able to drag (can only drag if we are in a week view)
    const justDraggedRef = useRef(false); // helps us determine if we did drag or if we clicked
    const startXRef = useRef(null);
    const [isInsideCanvas, setIsInsideCanvas] = useState(false);

    const [tooltipData, setTooltipData] = useState({});

    function formatRank(rank) {
        const j = rank % 10,
                k = rank % 100;
        if (j === 1 && k !== 11) return `${rank}st`;
        if (j === 2 && k !== 12) return `${rank}nd`;
        if (j === 3 && k !== 13) return `${rank}rd`;
        
        return `${rank}th`;
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
    
    useEffect(() => {
        filterOption === "recency" ? filterRecency(filterItem, firstGame, lastGame, setStartDate, setEndDate): undefined;
    }, [id, filterItem, filterOption])
        
    useEffect(() => {
        const loadStats = async () => {
            const stats = await getGameData("team", id, startDate, endDate);
            setTeamStats(stats.reverse());
        }
        if (!startDate) return;
        loadStats();
    }, [startDate, endDate])
        
    useEffect(() => {
        const tooltip = createGraph(canvasRef, isInsideCanvas, mouseXPosition, hoveredPointRef, teamStats, firstGame, filterItem, filterOption, graphOption, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct);
        setTooltipData(tooltip);
        if (teamStats.length > 0 && !foundLast) {
            setFoundLast(true);
            setLastGame(new Date(teamStats[teamStats.length - 1].date));
            setEndDate(new Date(teamStats[teamStats.length - 1].date));
        }
    }, [teamStats, graphOption, filterOption, filterItem, mouseXPosition])
    
    useEffect(() => {
        if (teamStats.length > 0 && !foundFirst && (filterOption === "granularity" || filterItem === "season")) {
            setFoundFirst(true);
            setFirstGame(new Date(teamStats[0].date));
            setStartDate(new Date(teamStats[0].date));
        }
    }, [teamStats])
    
    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <p className="close-modal" onClick={onClose}>&times;</p>
                    <img className="modal-heart" src={isFav ? "/heart.png" : "empty-heart.png"} onClick={toggleFav} />
                    <div className="team-header">
                        <img src={logo_url} />
                    <div className="team-info">
                        <h3>{name} ({record})</h3>
                            <div className="team-stats">
                                <div className="team-stats-column">
                                    <Tooltip text="Points per game | League rank"><p>PTS: {pts.toFixed(1)} | {formatRank(pts_rank)}</p></Tooltip>
                                    <Tooltip text="Assists per game | League rank"><p>AST: {ast.toFixed(1)} | {formatRank(ast_rank)}</p></Tooltip>
                                    <Tooltip text="Rebounds per game | League rank"><p>REB: {reb.toFixed(1)} | {formatRank(reb_rank)}</p></Tooltip>
                                    <Tooltip text="Offensive rebounds per game | League rank"><p>OREB: {oreb.toFixed(1)} | {formatRank(oreb_rank)}</p></Tooltip>
                                </div>
                                <div className="team-stats-column">
                                    <Tooltip text="Blocks per game | League rank"><p>BLK: {blk.toFixed(1)} | {formatRank(blk_rank)}</p></Tooltip>
                                    <Tooltip text="Steals per game | League rank"><p>STL: {stl.toFixed(1)} | {formatRank(stl_rank)}</p></Tooltip>
                                    <Tooltip text="Turnovers per game | League rank"><p>TOV: {tov.toFixed(1)} | {formatRank(tov_rank)}</p></Tooltip>
                                </div>
                                <div className="team-stats-column">
                                    <Tooltip text="Field goal percentage | League rank"><p>FG%: {fg_pct.toFixed(1)}% | {formatRank(fg_pct_rank)}</p></Tooltip>
                                    <Tooltip text="3-point percentage | League rank"><p>3P%: {fg3_pct.toFixed(1)}% | {formatRank(fg3_pct_rank)}</p></Tooltip>
                                </div>
                                <div className="team-stats-column">
                                    <Tooltip text="Opponent points per game | League rank"><p>OPP PTS: {oppg.toFixed(1)} | {formatRank(oppg_rank)}</p></Tooltip>
                                    <Tooltip text="Opponent rebounds per game | League rank"><p>OPP REB: {opp_reb.toFixed(1)} | {formatRank(opp_reb_rank)}</p></Tooltip>
                                    <Tooltip text="Opponent offensive rebounds per game | League rank"><p>OPP OREB: {opp_oreb.toFixed(1)} | {formatRank(opp_oreb_rank)}</p></Tooltip>
                                </div>
                                <div className="team-stats-column">
                                    <Tooltip text="Opponent turnovers per game | League rank"><p>OPP TOV: {opp_tov.toFixed(1)} | {formatRank(opp_tov_rank)}</p></Tooltip>
                                    <Tooltip text="Opponent average field goal percentage | League rank"><p>OPP FG%: {opp_fg_pct.toFixed(1)}% | {formatRank(opp_fg_pct_rank)}</p></Tooltip>
                                    <Tooltip text="Opponent average 3-point percentage | League rank"><p>OPP 3P%: {opp_fg3_pct.toFixed(1)}% | {formatRank(opp_fg3_pct_rank)}</p></Tooltip>
                                </div>
                            </div>
                        </div>
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
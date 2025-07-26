import { useEffect, useState } from "react"
import "react-datepicker/dist/react-datepicker.css";
import "../App.css"
import { getPointsPrediction, updateInteractionCounts} from "../utils/api"
import { Tooltip } from "./Tooltip"
import { handleMouseMove, handleMouseDown, handleMouseUp, handleCanvasClick } from "../utils/utils"
import { Loader } from "./Loader";
import { useRecencyFilter } from "../../hooks/useRecencyFilter";
import { useGraph } from "../../hooks/useGraph";
import { useStatsLoader } from "../../hooks/useStatsLoader";
import { useFindBoundaryGames } from "../../hooks/useFindBoundaryGames";
import { useUpdateInteractionCounts } from "../../hooks/useUpdateInteractionCounts";
import { useModelVars } from "../../hooks/useModelVars";
import { Graph } from "./Graph";

export function PlayerModal({ onClose, data, isFav, toggleFav }) {
    const { id, image_url, name, team, position, age, height, weight, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct } = data;

    const {
        session,
        mouseXPosition, setMouseXPosition,
        hoveredPointRef,
        graphOption, setGraphOption, 
        filterOption, setFilterOption,
        filterItem, setFilterItem,
        firstGame, setFirstGame,
        lastGame, setLastGame,
        canvasRef,
        draggingRef,
        justDraggedRef,
        startXRef,
        isInsideCanvas, setIsInsideCanvas
    } = useModelVars()

    const [loading, setLoading] = useState(false);

    const [calculatedFeatures, setCalculatedFeatures] = useState(false); // (setting as state otherwise value won't save)
    const [predictedPoints, setPredictedPoints] = useState(null); // (setting as state otherwise value won't save)

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

    // effect for changing recency
    // want this to run on model load and shoot anytime the recency item changes or the filter option changes
    // the beginning and ending date for the range to query
    const { startDate, endDate, setStartDate, setEndDate } = useRecencyFilter(id, filterOption, filterItem, firstGame, lastGame);
    
    // only want to load new stats whenever the date range changes
    const playerStats = useStatsLoader("player", id, startDate, endDate);
    
    // changing what the graph looks like either when the date range changes, the filter option changes, or the tool tip data changes (for tooltip and hover animation)
    // data to be shown on graph for tooltip
    const tooltipData = useGraph(canvasRef, isInsideCanvas, mouseXPosition, hoveredPointRef, playerStats, firstGame, filterItem, filterOption, graphOption, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct);
    // doing this so that the tooltip position adjusts to where the data point is
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
                            <div><strong>{graphOption}:</strong> {tooltipData?.value?.toFixed(0)}</div>
                        </div>

    useFindBoundaryGames(playerStats, filterOption, filterItem, setStartDate, setEndDate, setFirstGame, setLastGame);
    useUpdateInteractionCounts(session, startDate, endDate, filterOption, filterItem, isInsideCanvas, tooltipData);

    useEffect(() => {
        if (playerStats.length > 0 && !calculatedFeatures) {
            getLast7GameAvg();
            getOpponentPointsAllowed();
            setCalculatedFeatures(true);
        }
    }, [playerStats])

    return (
        <div data-cy="player-modal" className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <p className="close-modal" onClick={onClose}>&times;</p>
                <img className="modal-heart" src={isFav ? "/heart.png" : "empty-heart.png"} onClick={toggleFav} />
                <div className="player-header">
                    <img src={image_url} />
                    <div className="player-info">
                        <div className="player-metrics">
                            <h3 data-cy="modal-name">{name} | {team} </h3>
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
                    <button data-cy="prediction-button" onClick={getPredictedPoints}>Predict next game points</button>
                    {calculatedFeatures && predictedPoints && <p data-cy="predicted-points">Predicted points for next game: <strong>{predictedPoints}</strong></p>}
                </div>
                <Graph
                    handleMouseMove={handleMouseMove}
                    handleMouseDown={handleMouseDown}
                    handleMouseUp={handleMouseUp}
                    setMouseXPosition={setMouseXPosition}
                    draggingRef={draggingRef}
                    justDraggedRef={justDraggedRef}
                    hoveredPointRef={hoveredPointRef}
                    startXRef={startXRef}
                    handleCanvasClick={handleCanvasClick}
                    canvasRef={canvasRef}
                    isInsideCanvas={isInsideCanvas}
                    setIsInsideCanvas={setIsInsideCanvas}
                    tooltipData={tooltipData}
                    graphTooltip={GRAPH_TOOLTIP}
                    setGraphOption={setGraphOption}
                    filterOption={filterOption}
                    setFilterOption={setFilterOption}
                    filterItem={filterItem}
                    setFilterItem={setFilterItem}
                    startDate={startDate}
                    endDate={endDate}
                    firstGame={firstGame}
                    lastGame={lastGame}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                />
                {loading && <Loader/>}
            </div>
        </div>
    )
}
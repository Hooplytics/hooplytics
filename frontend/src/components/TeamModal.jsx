import "react-datepicker/dist/react-datepicker.css";
import "../App.css"
import { Graph } from "./Graph";
import { Tooltip } from "./Tooltip"
import { handleMouseMove, handleMouseDown, handleMouseUp, handleCanvasClick } from "../utils/utils"
import { useRecencyFilter } from "../../hooks/useRecencyFilter";
import { useGraph } from "../../hooks/useGraph";
import { useStatsLoader } from "../../hooks/useStatsLoader";
import { useFindBoundaryGames } from "../../hooks/useFindBoundaryGames";
import { useUpdateInteractionCounts } from "../../hooks/useUpdateInteractionCounts";
import { useModelVars } from "../../hooks/useModelVars";

export function TeamModal({ onClose, data, isFav, toggleFav }) {
    const { id, logo_url, name, record, pts, pts_rank, ast, ast_rank, reb, reb_rank, oreb, oreb_rank, blk, blk_rank, stl, stl_rank, tov, tov_rank, fg_pct, fg_pct_rank, fg3_pct, fg3_pct_rank, oppg, oppg_rank, opp_reb, opp_reb_rank, opp_oreb, opp_oreb_rank, opp_tov, opp_tov_rank, opp_fg_pct, opp_fg_pct_rank, opp_fg3_pct, opp_fg3_pct_rank } = data;
    
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

    function formatRank(rank) {
        const j = rank % 10,
                k = rank % 100;
        if (j === 1 && k !== 11) return `${rank}st`;
        if (j === 2 && k !== 12) return `${rank}nd`;
        if (j === 3 && k !== 13) return `${rank}rd`;
        
        return `${rank}th`;
    }
    
    // effect for changing recency
    // want this to run on model load and shoot anytime the recency item changes or the filter option changes
    // the beginning and ending date for the range to query
    const { startDate, endDate, setStartDate, setEndDate } = useRecencyFilter(id, filterOption, filterItem, firstGame, lastGame);
    
    // only want to load new stats whenever the date range changes
    const teamStats = useStatsLoader("team", id, startDate, endDate);
    
    // changing what the graph looks like either when the date range changes, the filter option changes, or the tool tip data changes (for tooltip and hover animation)
    // data to be shown on graph for tooltip
    const tooltipData = useGraph(canvasRef, isInsideCanvas, mouseXPosition, hoveredPointRef, teamStats, firstGame, filterItem, filterOption, graphOption, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct);
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
    
    useFindBoundaryGames(teamStats, filterOption, filterItem, setStartDate, setEndDate, setFirstGame, setLastGame);
    useUpdateInteractionCounts(session, startDate, endDate, filterOption, filterItem, isInsideCanvas, tooltipData);
    
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
            </div>
        </div>
    )
}
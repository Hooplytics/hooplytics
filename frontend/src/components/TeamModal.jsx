import "../App.css"
import { Tooltip } from "./Tooltip";

export function TeamModal({ onClose, data, isFav, toggleFav }) {

    function formatRank(rank) {
        const j = rank % 10,
                k = rank % 100;
        if (j === 1 && k !== 11) return `${rank}st`;
        if (j === 2 && k !== 12) return `${rank}nd`;
        if (j === 3 && k !== 13) return `${rank}rd`;
        
        return `${rank}th`;
    }
    
    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
                <div className="modal-content" onClick={(e) => e.stopPropagation}>
                    <p className="close-modal" onClick={onClose}>&times;</p>
                    <img className="modal-heart" src={isFav ? "/heart.png" : "empty-heart.png"} onClick={toggleFav} />
                    <div className="team-header">
                        <img src={data?.logo_url} />
                    <div className="team-info">
                        <h3>{data?.name} ({data?.record})</h3>
                            <div className="team-stats">
                                <div className="team-stats-column">
                                    <Tooltip text="Points per game | League rank"><p>PTS: {data?.pts.toFixed(1)} | {formatRank(data?.pts_rank)}</p></Tooltip>
                                    <Tooltip text="Assists per game | League rank"><p>AST: {data?.ast.toFixed(1)} | {formatRank(data?.ast_rank)}</p></Tooltip>
                                    <Tooltip text="Rebounds per game | League rank"><p>REB: {data?.reb.toFixed(1)} | {formatRank(data?.reb_rank)}</p></Tooltip>
                                    <Tooltip text="Offensive rebounds per game | League rank"><p>OREB: {data?.oreb.toFixed(1)} | {formatRank(data?.oreb_rank)}</p></Tooltip>
                                </div>
                                <div className="team-stats-column">
                                    <Tooltip text="Blocks per game | League rank"><p>BLK: {data?.blk.toFixed(1)} | {formatRank(data?.blk_rank)}</p></Tooltip>
                                    <Tooltip text="Steals per game | League rank"><p>STL: {data?.stl.toFixed(1)} | {formatRank(data?.stl_rank)}</p></Tooltip>
                                    <Tooltip text="Turnovers per game | League rank"><p>TOV: {data?.tov.toFixed(1)} | {formatRank(data?.tov_rank)}</p></Tooltip>
                                </div>
                                <div className="team-stats-column">
                                    <Tooltip text="Field goal percentage | League rank"><p>FG%: {data?.fg_pct.toFixed(1)}% | {formatRank(data?.fg_pct_rank)}</p></Tooltip>
                                    <Tooltip text="3-point percentage | League rank"><p>3P%: {data?.fg3_pct.toFixed(1)}% | {formatRank(data?.fg3_pct_rank)}</p></Tooltip>
                                </div>
                                <div className="team-stats-column">
                                    <Tooltip text="Opponent points per game | League rank"><p>OPP PTS: {data?.oppg.toFixed(1)} | {formatRank(data?.oppg_rank)}</p></Tooltip>
                                    <Tooltip text="Opponent rebounds per game | League rank"><p>OPP REB: {data?.opp_reb.toFixed(1)} | {formatRank(data?.opp_reb_rank)}</p></Tooltip>
                                    <Tooltip text="Opponent offensive rebounds per game | League rank"><p>OPP OREB: {data?.opp_oreb.toFixed(1)} | {formatRank(data?.opp_oreb_rank)}</p></Tooltip>
                                </div>
                                <div className="team-stats-column">
                                    <Tooltip text="Opponent turnovers per game | League rank"><p>OPP TOV: {data?.opp_tov.toFixed(1)} | {formatRank(data?.opp_tov_rank)}</p></Tooltip>
                                    <Tooltip text="Opponent average field goal percentage | League rank"><p>OPP FG%: {data?.opp_fg_pct.toFixed(1)}% | {formatRank(data?.opp_fg_pct_rank)}</p></Tooltip>
                                    <Tooltip text="Opponent average 3-point percentage | League rank"><p>OPP 3P%: {data?.opp_fg3_pct.toFixed(1)}% | {formatRank(data?.opp_fg3_pct_rank)}</p></Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                <div className="team-chart"><h1>CHART GOES HERE</h1></div>
            </div>
        </div>
    )
}
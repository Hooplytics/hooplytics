import "../App.css"

export function TeamModal({ onClose, data }) {

    function formatRank(rank) {
        const j = rank % 10,
                k = rank % 100;
        if (j === 1 && k !== 11) return `${rank}st`;
        if (j === 2 && k !== 12) return `${rank}nd`;
        if (j === 3 && k !== 13) return `${rank}rd`;
        
        return `${rank}th`;
    }
    console.log(data)
    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
                <div className="modal-content" onClick={(e) => e.stopPropagation}>
                    <p className="close-modal" onClick={onClose}>&times;</p>
                    <div className="team-header">
                        <img src={data?.logo_url} />
                    <div className="team-info">
                        <h3>{data?.name} ({data?.record})</h3>
                        <div className="team-stats">
                            <div className="team-stats-column">
                                <p>PTS: {data?.pts.toFixed(1)} | {formatRank(data?.pts_rank)}</p>
                                <p>AST: {data?.ast.toFixed(1)} | {formatRank(data?.ast_rank)}</p>
                                <p>REB: {data?.reb.toFixed(1)} | {formatRank(data?.reb_rank)}</p>
                                <p>OREB: 10.1 | 24th</p>
                            </div>
                            <div className="team-stats-column">
                                <p>BLK: {data?.blk.toFixed(1)} | {formatRank(data?.blk_rank)}</p>
                                <p>STL: {data?.stl.toFixed(1)} | {formatRank(data?.stl_rank)}</p>
                                <p>TOV: {data?.tov.toFixed(1)} | {formatRank(data?.tov_rank)}</p>
                            </div>
                            <div className="team-stats-column">
                                <p>FG%: {data?.fg_pct.toFixed(1)}% | {formatRank(data?.fg_pct_rank)}</p>
                                <p>3P%: {data?.fg3_pct.toFixed(1)}% | {formatRank(data?.fg3_pct_rank)}</p>
                            </div>
                            <div className="team-stats-column">
                                <p>OPP PTS: {data?.oppg.toFixed(1)} | {formatRank(data?.oppg_rank)}</p>
                                <p>OPP REB: {data?.opp_reb.toFixed(1)} | {formatRank(data?.opp_reb_rank)}</p>
                                <p>OPP OREB: {data?.opp_oreb.toFixed(1)} | {formatRank(data?.opp_oreb_rank)}</p>
                            </div>
                            <div className="team-stats-column">
                                <p>OPP TOV: {data?.opp_tov.toFixed(1)} | {formatRank(data?.opp_tov_rank)}</p>
                                <p>OPP FG%: {data?.opp_fg_pct.toFixed(1)}% | {formatRank(data?.opp_fg_pct_rank)}</p>
                                <p>OPP 3P%: {data?.opp_fg3_pct.toFixed(1)}% | {formatRank(data?.opp_fg3_pct_rank)}</p>
                            </div>
                        </div>
                        </div>
                    </div>
                <div className="team-chart"><h1>CHART GOES HERE</h1></div>
            </div>
        </div>
    )
}
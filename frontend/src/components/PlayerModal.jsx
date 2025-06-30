import "../App.css"

export function PlayerModal({onClose, data}) {
    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal-content" onClick={(e) => e.stopPropagation}>
                <p className="close-modal" onClick={onClose}>&times;</p>
                <div className="player-header">
                    <img src={data.image_url} />
                    <div className="player-info">
                        <div className="player-metrics">
                            <h3>{data.name} | {data.team} </h3>
                            <h6>{data.position}</h6>
                            <h6><strong>Age:</strong> {data.age}</h6>
                            <h6><strong>Height:</strong> {data.height}</h6>
                            <h6><strong>Weight:</strong> {data.weight} lbs</h6>
                        </div>
                        <div className="player-stats">
                            <div className="player-stats-column">
                                <p>PTS: {data.pts.toFixed(1)}</p>
                                <p>AST: {data.ast.toFixed(1)}</p>
                                <p>REB: {data.reb.toFixed(1)}</p>
                            </div>
                            <div className="player-stats-column">
                                <p>BLK: {data.blk.toFixed(1)}</p>
                                <p>STL: {data.stl.toFixed(1)}</p>
                                <p>TOV: {data.tov.toFixed(1)}</p>
                            </div>
                            <div className="player-stats-column">
                                <p>FG%: {data.fg_pct.toFixed(1)}%</p>
                                <p>3P%: {data.fg3_pct.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                    </div>
                    <div className="chart"><h1>CHART GOES HERE</h1></div>
            </div>
        </div>
    )
}
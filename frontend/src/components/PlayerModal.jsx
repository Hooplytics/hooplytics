import "../App.css"

export function PlayerModal({onClose}) {
    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal-content" onClick={(e) => e.stopPropagation}>
                <p className="close-modal" onClick={onClose}>&times;</p>
                <div className="player-header">
                    <img src="https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png" />
                    <div className="player-info">
                        <div className="player-metrics">
                            <h3>Stephen Curry | GSW </h3>
                            <h6>Guard</h6>
                            <h6><strong>Age:</strong> 34</h6>
                            <h6><strong>Height:</strong> 6' 2"</h6>
                            <h6><strong>Weight:</strong> 185 lbs</h6>
                        </div>
                        <div className="player-stats">
                            <div className="player-stats-column">
                                <p>PTS: 24.5</p>
                                <p>AST: 6.0</p>
                                <p>REB: 4.4</p>
                            </div>
                            <div className="player-stats-column">
                                <p>BLK: 0.4</p>
                                <p>STL: 1.1</p>
                                <p>TOV: 2.9</p>
                            </div>
                            <div className="player-stats-column">
                                <p>FG%: 44.8%</p>
                                <p>3P%: 39.7%</p>
                            </div>
                        </div>
                    </div>
                    </div>
                    <div className="chart"><h1>CHART GOES HERE</h1></div>
            </div>
        </div>
    )
}
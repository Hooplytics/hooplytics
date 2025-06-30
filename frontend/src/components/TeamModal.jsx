import "../App.css"

export function TeamModal({ onClose }) {
    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
                <div className="modal-content" onClick={(e) => e.stopPropagation}>
                    <p className="close-modal" onClick={onClose}>&times;</p>
                    <div className="team-header">
                        <img src="https://cdn.nba.com/logos/nba/1610612742/global/L/logo.svg" />
                    <div className="team-info">
                        <h3>Dallas Mavericks (39-43)</h3>
                        <div className="team-stats">
                            <div className="team-stats-column">
                                <p>PTS: 114.2 | 15th</p>
                                <p>AST: 25.2 | 22nd</p>
                                <p>REB: 43 | 23rd</p>
                                <p>OREB: 10.1 | 24th</p>
                            </div>
                            <div className="team-stats-column">
                                <p>BLK: 5.4 | 7th</p>
                                <p>STL: 7.8 | 21st</p>
                                <p>TOV: 14 | 13rd</p>
                            </div>
                            <div className="team-stats-column">
                                <p>FG%: 47.9% | 10th</p>
                                <p>3P%: 36.4% | 15th</p>
                            </div>
                            <div className="team-stats-column">
                                <p>OPP PTS: 115.4 | 20th</p>
                                <p>OPP REB: 45.3 | 25th</p>
                                <p>OPP OREB: 12.1 | 29th</p>
                            </div>
                            <div className="team-stats-column">
                                <p>OPP TOV: 13.2 | 24th</p>
                                <p>OPP FG%: 46.9% | 18th</p>
                                <p>OPP 3P%: 36.3% | 19th</p>
                            </div>
                        </div>
                        </div>
                    </div>
                <div className="team-chart"><h1>CHART GOES HERE</h1></div>
            </div>
        </div>
    )
}
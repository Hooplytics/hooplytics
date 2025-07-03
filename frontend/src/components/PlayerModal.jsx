import { useEffect, useState, useRef } from "react"
import "../App.css"
import { getPlayerGameData } from "../utils/api"
import { Tooltip } from "./Tooltip"

export function PlayerModal({ onClose, data, isFav, toggleFav }) {
    const [graphOption, setGraphOption] = useState("points")
    const [playerStats, setPlayerStats] = useState([])
    

    const getPoints = async (id) => {
        setPlayerStats((await getPlayerGameData(id)).reverse());
    }

    useEffect(() => {
        getPoints(data.id);
    }, [data.id])

    useEffect(() => {
        console.log(playerStats);
    }, [playerStats])

    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal-content" onClick={(e) => e.stopPropagation}>
                <p className="close-modal" onClick={onClose}>&times;</p>
                <img className="modal-heart" src={isFav ? "/heart.png" : "empty-heart.png"} onClick={toggleFav} />
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
                                <Tooltip text="Points per game"><p>PTS: {data.pts.toFixed(1)}</p></Tooltip>
                                <Tooltip text="Assists per game"><p>AST: {data.ast.toFixed(1)}</p></Tooltip>
                                <Tooltip text="Rebounds per game"><p>REB: {data.reb.toFixed(1)}</p></Tooltip>
                            </div>
                            <div className="player-stats-column">
                                <Tooltip text="Blocks per game"><p>BLK: {data.blk.toFixed(1)}</p></Tooltip>
                                <Tooltip text="Steals per game"><p>STL: {data.stl.toFixed(1)}</p></Tooltip>
                                <Tooltip text="Turnovers per game"><p>TOV: {data.tov.toFixed(1)}</p></Tooltip>
                            </div>
                            <div className="player-stats-column">
                                <Tooltip text="Average field goal percentage"><p>FG%: {data.fg_pct.toFixed(1)}%</p></Tooltip>
                                <Tooltip text="Average 3-point percentage"><p>3P%: {data.fg3_pct.toFixed(1)}%</p></Tooltip>
                            </div>
                            </div>
                    </div>
                    </div>
                <canvas id="canvas"></canvas>
            </div>
        </div>
    )
}
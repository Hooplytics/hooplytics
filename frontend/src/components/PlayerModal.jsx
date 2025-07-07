import { useEffect, useState, useRef } from "react"
import "../App.css"
import { getPlayerGameData } from "../utils/api"
import { Tooltip } from "./Tooltip"

export function PlayerModal({ onClose, data, isFav, toggleFav }) {
    const [graphOption, setGraphOption] = useState("points");
    const [playerStats, setPlayerStats] = useState([]);
    const canvasRef = useRef(null);
    

    useEffect(() => {
        async function load() {
            const stats = await getPlayerGameData(data.id)
            setPlayerStats(stats)
        }
        
        load()
    }, [data.id])
    
    useEffect(() => {
        const stats = playerStats.map(game => game[graphOption]);
        const dates = playerStats.map(game => game.date);

        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        const containerHeight = canvas.height;
        const containerWidth = canvas.width;
        context.clearRect(0, 0, containerWidth, containerHeight)

        const margin = { top: 20, bottom: 40, left: 40, right: 20 };
        const height = containerHeight - margin.top - margin.bottom;
        const width = containerWidth - margin.left - margin.right;
        const xScale = width / (playerStats.length - 1)
        
        const maxY = Math.max(...stats);
        const yScale = height / maxY;

        context.save()
        context.translate(margin.left, margin.top)

        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, height);
        context.lineTo(width, height);
        context.stroke();
        context.closePath();
        
        let lastX = 0;
        let lastY = 0;
        context.beginPath();
        stats.forEach((stat, index) => {
            const x = xScale * index;
            const y = height - (stat * yScale)
            if (index === 0) {
                context.moveTo(lastX, y);
            } else {
                context.moveTo(lastX, lastY);
            }
            context.lineTo(x, y);
            lastX = x;
            lastY = y;
        });
        context.strokeStyle = "#007bff";
        context.lineWidth = 2;
        context.stroke();
    

        context.restore();
    }, [playerStats, graphOption])

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
                <div className="chart-wrapper">
                    <canvas ref={canvasRef} width={800} height={450} id="canvas" />
                </div>
            </div>
        </div>
    )
}
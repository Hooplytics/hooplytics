import { useEffect, useState, useRef } from "react"
import "../App.css"
import { getPlayerGameData } from "../utils/api"
import { Tooltip } from "./Tooltip"

export function PlayerModal({ onClose, data, isFav, toggleFav }) {
    const { id, image_url, name, team, position, age, height, weight, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct } = data;

    const [graphOption, setGraphOption] = useState("points");
    const [playerStats, setPlayerStats] = useState([]);
    const canvasRef = useRef(null);

    const MARGIN_TR = 20; // margin for top and right
    const MARGIN_BL = 40; // margin for bottom and left

    const createGraph = () => {
        const stats = playerStats.map(game => game[graphOption]);
        const dates = playerStats.map(game => game.date);

        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        const containerHeight = canvas.height;
        const containerWidth = canvas.width;
        context.clearRect(0, 0, containerWidth, containerHeight)

        const height = containerHeight - MARGIN_TR - MARGIN_BL;
        const width = containerWidth - MARGIN_TR - MARGIN_BL;
        const xScale = width / (playerStats.length - 1)
        
        const maxY = Math.max(...stats);
        const yScale = height / maxY;

        context.save()
        context.translate(MARGIN_BL, MARGIN_TR)

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
            context.arc(x, y, 2, 0, 2 * Math.PI);
            lastX = x;
            lastY = y;
        });

        context.strokeStyle = "#007bff";
        context.lineWidth = 2;
        context.stroke();

        context.font = "16px Arial";
        context.fillStyle = "white";
        context.fillText(0, -25, height + 5);

        context.font = "16px Arial";
        context.fillStyle = "white";
        context.fillText(Math.round(maxY / 4), -25, (height / 4) * 3);

        context.font = "16px Arial";
        context.fillStyle = "white";
        context.fillText(Math.round(maxY / 2), -25, (height / 4) * 2);

        context.font = "16px Arial";
        context.fillStyle = "white";
        context.fillText(Math.round(maxY / 4 * 3), -25, height / 4);

        context.font = "16px Arial";
        context.fillStyle = "white";
        context.fillText(maxY, -25, 10);
    

        context.restore();
    }
    

    useEffect(() => {
        async function load() {
            const stats = await getPlayerGameData(id)
            setPlayerStats(stats)
        }
        
        load()
    }, [id])

    
    useEffect(() => {
        createGraph();
        console.log(playerStats);
    }, [playerStats, graphOption])

    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal-content" onClick={(e) => e.stopPropagation}>
                <p className="close-modal" onClick={onClose}>&times;</p>
                <img className="modal-heart" src={isFav ? "/heart.png" : "empty-heart.png"} onClick={toggleFav} />
                <div className="player-header">
                    <img src={image_url} />
                    <div className="player-info">
                        <div className="player-metrics">
                            <h3>{name} | {team} </h3>
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
                <div className="chart-wrapper">
                    <select className="graph-select"onChange={(e) => {
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
                    <canvas ref={canvasRef} width={800} height={450} id="canvas" />
                </div>
            </div>
        </div>
    )
}
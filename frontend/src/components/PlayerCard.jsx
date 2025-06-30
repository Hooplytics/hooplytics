import { useState } from "react"
import "../App.css"
import { PlayerModal } from "./PlayerModal"

export function PlayerCard({data}) {
    const [showModal, setShowModal] = useState(false);

    const handleShowModal = () => {
        setShowModal(prev => !prev);
    }

    return (
        <div>
            <div className="search-card" onClick={handleShowModal}>
                <img src={data.image_url} />
                <h5>{data.name} | {data.team}</h5>
                <p>{data.height} | {data.weight} lbs</p>
                <p>{data.position}</p>
            </div>
            {showModal && <PlayerModal data={data} onClose={handleShowModal} />}
        </div>
    )
}
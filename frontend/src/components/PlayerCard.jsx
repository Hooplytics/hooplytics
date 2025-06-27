import { useState } from "react"
import "../App.css"
import { PlayerModal } from "./PlayerModal"

export function PlayerCard() {
    const [showModal, setShowModal] = useState(false);

    const handleShowModal = () => {
        setShowModal(prev => !prev);
    }

    return (
        <div>
            <div className="search-card" onClick={handleShowModal}>
                <img src="https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png" />
                <h5>Stephen Curry | GSW</h5>
                <p>6' 2" | 185lbs</p>
                <p>Guard</p>
            </div>
            {showModal && <PlayerModal onClose={handleShowModal} />}
        </div>
    )
}
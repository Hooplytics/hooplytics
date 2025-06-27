import "../App.css"

import { useState } from "react";
import { TeamModal } from "./TeamModal";

export function TeamCard() {
    const [showModal, setShowModal] = useState(false);
    
    const handleShowModal = () => {
        setShowModal(prev => !prev);
    }

    return (
        <div>
            <div className="search-card" onClick={handleShowModal}>
                <img src="https://cdn.nba.com/logos/nba/1610612742/global/L/logo.svg" />
                <h5>Dallas Mavericks</h5>
                <p>39-43</p>
            </div>
            {showModal && <TeamModal onClose={handleShowModal} />}
        </div>
    )
}
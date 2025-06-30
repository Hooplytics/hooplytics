import "../App.css"

import { useState } from "react";
import { TeamModal } from "./TeamModal";

export function TeamCard({data}) {
    const [showModal, setShowModal] = useState(false);
    
    const handleShowModal = () => {
        setShowModal(prev => !prev);
    }

    return (
        <div>
            <div className="search-card" onClick={handleShowModal}>
                <img src={data.logo_url} />
                <h5>{data.name}</h5>
                <p>{data.record}</p>
            </div>
            {showModal && <TeamModal data={data} onClose={handleShowModal} />}
        </div>
    )
}
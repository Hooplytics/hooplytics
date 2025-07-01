import "../App.css"

import { useState } from "react"
import { TeamModal } from "./TeamModal";
import { UserAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

export function TeamCard({data}) {
    const { session } = UserAuth();
    const { favorites, toggle } = useFavorites();
    const [isFav, setIsFav] = useState(favorites.teams.includes(data.id));
    const [showModal, setShowModal] = useState(false);
    
    const handleToggle = async (e) => {
        e.stopPropagation();
        setIsFav(prev => !prev);

        try {  
            await toggle(data.id, "team");
        } catch (err) {
            console.error("Could not toggle favorite:", err);
            setIsFav(prev => !prev);
        }
    };

    const handleShowModal = () => {
        setShowModal(prev => !prev);
    }

    return (
        <div>
            <div className="search-card" onClick={handleShowModal}>
                {session && <img src="/heart.png" className={isFav ? "active card-heart" : "card-heart"} onClick={handleToggle}/>}
                <img src={data.logo_url} />
                <h5>{data.name}</h5>
                <p>{data.record}</p>
            </div>
            {showModal && <TeamModal data={data} onClose={handleShowModal} isFav={isFav} toggleFav={handleToggle} />}
        </div>
    )
}
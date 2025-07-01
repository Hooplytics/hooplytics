import { useState } from "react"
import "../App.css"
import { PlayerModal } from "./PlayerModal"
import { UserAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

export function PlayerCard({ data }) {
    const { session } = UserAuth();
    const { favorites, toggle } = useFavorites();
    const [isFav, setIsFav] = useState(favorites.players.includes(data.id));
    const [showModal, setShowModal] = useState(false);

    const handleToggle = async (e) => {
        e.stopPropagation();
        setIsFav(prev => !prev);

        try {  
            await toggle(data.id, "player");
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
                <img src={data.image_url} />
                <h5>{data.name} | {data.team}</h5>
                <p>{data.height} | {data.weight} lbs</p>
                <p>{data.position}</p>
            </div>
            {showModal && <PlayerModal data={data} onClose={handleShowModal} isFav={isFav} toggleFav={handleToggle} />}
        </div>
    )
}
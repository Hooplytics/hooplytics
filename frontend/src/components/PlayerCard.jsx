import { useState } from "react"
import "../App.css"
import { PlayerModal } from "./PlayerModal"
import { UserAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { Tooltip } from "./Tooltip";

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
            setIsFav(prev => !prev);
            alert("Could not toggle favorite:", err);
        }
    };

    const handleShowModal = () => {
        setShowModal(prev => !prev);
    }

    return (
        <div>
            <div className="search-card" onClick={handleShowModal}>
                {session && (<Tooltip text={isFav ? "Unfavorite player" : "Favorite player"} >
                        <img src="/heart.png" className={isFav ? "active card-heart" : "card-heart"} onClick={handleToggle} />
                    </Tooltip>)
                }
                <img src={data.image_url} />
                <h5>{data.name} | {data.team}</h5>
                {(data.height || data.weight) && <p>{data.height} | {data.weight} lbs</p>}
                <p>{data.position}</p>
            </div>
            {showModal && <PlayerModal data={data} onClose={handleShowModal} isFav={isFav} toggleFav={handleToggle} />}
        </div>
    )
}
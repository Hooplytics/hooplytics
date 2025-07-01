import { PlayerCard } from "./PlayerCard";
import { TeamCard } from "./TeamCard";

export function SearchContainer({ option, data }) {
    const CardComponent = option === "Players" ? PlayerCard : TeamCard;

    return (
        <div className="search-result-container">
            {data?.map((obj) => {
                return <CardComponent key={obj.id} data={obj} />
            })}
        </div>
    )
}
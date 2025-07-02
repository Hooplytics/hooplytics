import "../App.css"

export function Tooltip({ text, children }) {
    return (
        <span className="tooltip">
            {children}
            <span className="tooltip-text">{text}</span>
        </span>
    );
}

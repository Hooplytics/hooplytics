import "../App.css"
import DatePicker from "react-datepicker";

export function Graph({
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    setMouseXPosition,
    draggingRef,
    justDraggedRef,
    hoveredPointRef,
    startXRef,
    handleCanvasClick,
    canvasRef,
    isInsideCanvas,
    setIsInsideCanvas,
    tooltipData,
    graphTooltip,
    setGraphOption,
    filterOption,
    setFilterOption,
    filterItem,
    setFilterItem,
    startDate,
    endDate,
    firstGame,
    lastGame,
    setStartDate,
    setEndDate}) {
    return (
        <div>
            <div className="chart-wrapper">
                <select data-cy="graph-stats" className="graph-select" onChange={(e) => {
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
                <canvas ref={canvasRef} width={800} height={450} onMouseMove={(e) => handleMouseMove(e, setMouseXPosition)} onMouseDown={(e) => handleMouseDown(e, startDate, endDate, draggingRef, startXRef, canvasRef)} onMouseUp={(e) => handleMouseUp(e, startXRef, draggingRef, justDraggedRef, canvasRef, startDate, endDate, setStartDate, setEndDate, setFilterItem)} id="canvas" onClick={() => handleCanvasClick(canvasRef, justDraggedRef, hoveredPointRef, setStartDate, setEndDate, setFilterItem)} onMouseEnter={() => setIsInsideCanvas(true)} onMouseLeave={() => setIsInsideCanvas(false)}/>
                {isInsideCanvas && tooltipData.show && graphTooltip}
            </div>
            <div className="graph-filter-by">
                <select className="filter" onChange={(e) => {
                    e.preventDefault();
                    setFilterOption(e.target.value);
                    if (e.target.value === "granularity") {
                        setStartDate(firstGame);
                        setEndDate(lastGame);
                        if (filterItem === "season") setFilterItem("month");
                    }
                }}>
                    <option default value="recency">Recency</option>
                    <option value="granularity" >Granularity</option>
                </select>
                <select className="filter" value={filterItem} onChange={(e) => {
                        e.preventDefault();
                        setFilterItem(e.target.value);
                    }}>
                    {filterOption === "recency" && <option value="season">Full Season</option>}
                    <option value="month">{ filterOption === "recency" ? "Last Month" : "Monthly" }</option>
                    <option value="week">{filterOption === "recency" ? "Last Week" : "Weekly"}</option>
                    {filterOption === "recency" && <option value="custom">Custom</option>}
                </select>
                {startDate && endDate && filterOption === "recency" && <div className="custom-dates">
                    <span>
                        <p>Start Date: </p>
                        <DatePicker selected={startDate} onChange={(date) => { setStartDate(date); setFilterItem("custom")}} placeholderText="Select a start date" minDate={firstGame} maxDate={lastGame} dateFormat="MMMM dd, yyyy"/>
                    </span>
                    <span>
                        <p>End Date: </p>
                        <DatePicker selected={endDate} onChange={(date) => { setEndDate(date);  setFilterItem("custom")}} placeholderText="Select a end date" minDate={startDate || firstGame} maxDate={lastGame} dateFormat="MMMM dd, yyyy" />
                    </span>
                </div>}
            </div>
        </div>
    )
}
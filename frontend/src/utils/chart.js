const MARGIN_TR = 20; // margin for top and right
const MARGIN_BL = 40; // margin for bottom and left

const LINE_WIDTH = 2;
const BLUE = "#007bff"; // used for blue line and circle
const RED_LINE = "#FF0000";
const WHITE_CIRCLE = "#FFFFFF"

const MILLISECONDS_IN_A_SECOND = 1000;
const SECS_IN_A_HR = 3600;
const HRS_IN_A_DAY = 24;
const DAYS_IN_A_WEEK = 7;
const WEEKS_IN_A_MONTH = 4;
const MS_IN_DAY = MILLISECONDS_IN_A_SECOND * SECS_IN_A_HR * HRS_IN_A_DAY;

export const isWeekRange = (startDate, endDate) => {
    const date = new Date(endDate - 6 * MS_IN_DAY)
    return date.getTime() === startDate.getTime();
}

export const centerWeek = (date, setStartDate, setEndDate, setFilterItem) => {
    setFilterItem("custom")
    const center = new Date(date);
    const start = new Date(center - 3 * MS_IN_DAY);
    const end = new Date(center);
    end.setDate(center.getDate() + 3);
    setStartDate(start);
    setEndDate(end);
}

export const filterRecency = (filterItem, firstGame, lastGame, setStartDate, setEndDate) => {
        const today = lastGame;
        let lastDate;
        if (filterItem === "season") {
            setStartDate(firstGame);
            setEndDate(lastGame);
        } else if (filterItem === "week") {
            lastDate = new Date(today.getTime() - ((DAYS_IN_A_WEEK - 1) * MS_IN_DAY));
            setStartDate(lastDate);
            setEndDate(today);
        } else if (filterItem === "month") {
            lastDate = new Date(today.getTime() - (WEEKS_IN_A_MONTH * DAYS_IN_A_WEEK * MS_IN_DAY));
            setStartDate(lastDate);
            setEndDate(today);
        }
    }

// getting the first interval (whether it be month or week)
const granularityInitialPeriods = (filterItem, firstGame) => {
        switch (filterItem) {
            case "week":
                return [firstGame, new Date(firstGame.getTime() + ((DAYS_IN_A_WEEK - 1) * HRS_IN_A_DAY * SECS_IN_A_HR * MILLISECONDS_IN_A_SECOND))];
            case "month":
                return [new Date(firstGame.getFullYear(), firstGame.getMonth(), 1), new Date(firstGame.getFullYear(), firstGame.getMonth() + 1, 0)];
            default:
                return []
        }
    }

// going to the next interval period (week or month)
const granularityPeriodUpdates = (dates, i, start, end, filterItem) => {
        switch (filterItem) {
            case "week":
                while (dates[i + 1] > end){
                    start = new Date(end.getTime() + (HRS_IN_A_DAY * SECS_IN_A_HR * MILLISECONDS_IN_A_SECOND));
                    end = new Date(start.getTime() + ((DAYS_IN_A_WEEK - 1) * HRS_IN_A_DAY * SECS_IN_A_HR * MILLISECONDS_IN_A_SECOND));
                };
                return [start, end];
            case "month":
                return [new Date(dates[i + 1].getFullYear(), dates[i + 1].getMonth(), 1), new Date(dates[i + 1].getFullYear(), dates[i + 1].getMonth() + 1, 0)];
            default:
                return []
        }
    }

// getting period by period data (week-by-week or month-by-month)
const granularity = (playerStats, graphOption, filterItem, firstGame) => {
        const stats = playerStats.map(game => game[graphOption]);
        const dates = playerStats.map(game => new Date(game.date));

        const granulatedStats = [];
        let currStats = 0;
        let currGames = 0;
        let [startPeriod, endPeriod] = granularityInitialPeriods(filterItem, firstGame);

        for (let i = 0; i < stats.length; ++i) {
            if (dates[i] >= startPeriod && dates[i] <= endPeriod) {
                currStats += stats[i];
                ++currGames;
            }
            if (i === stats.length - 1 || dates[i + 1] > endPeriod) {
                granulatedStats.push(currStats / currGames);
                currGames = 0;
                currStats = 0;
            } 
            if (i !== stats.length - 1) {
                [startPeriod, endPeriod] = granularityPeriodUpdates(dates, i, startPeriod, endPeriod, filterItem);
            }
        }
        return granulatedStats;
}

export const createGraph = (canvasRef, isInsideCanvas, mouseXPosition, hoveredPointRef, playerStats, firstGame, filterItem, filterOption, graphOption, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct) => {
    const stats = filterOption === "recency" ? playerStats.map(game => game[graphOption]) : granularity(playerStats, graphOption, filterItem, firstGame); // getting all the stats needed to be displayed
    const dates = playerStats.map(game => game.date); // getting the dates for displayed stats
    const dataPoints = [] // used to store location of data points

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    // height and width of overall container
    const containerHeight = canvas.height;
    const containerWidth = canvas.width;
    context.clearRect(0, 0, containerWidth, containerHeight)

    // height and width of actual graph
    const height = containerHeight - MARGIN_TR - MARGIN_BL;
    const width = containerWidth - MARGIN_TR - MARGIN_BL;

    const xScale = width / (stats.length - 1) // horizontal spacing between each data adjacent data point
    
    const maxY = Math.max(...stats);
    const yScale = height / maxY; // used to determine where along the y-axis to place the data point (ranges from 0 - maxY)

    context.save()
    context.translate(MARGIN_BL, MARGIN_TR) // updating our origin point to match the top left of the graph and not the container

    // drawing the axes
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, height);
    context.lineTo(width, height);
    context.stroke();
    context.closePath();
    
    // drawing the trend lines
    // lastX and lastY used to move the brush to the previous point without drawing extra lines
    let lastX = 0;
    let lastY = 0;
    context.beginPath();
    stats.forEach((stat, index) => {
        const x = xScale * index;
        const y = height - (stat * yScale) // how to calculate position along y-axis
        // if we're drawing the first point then we want the brush to go to the respective position on the y-axis
        // else we move to last data point
        if (index === 0) {
            context.moveTo(lastX, y);
        } else {
            context.moveTo(lastX, lastY);
        }
        context.lineTo(x, y);
        context.arc(x, y, 2, 0, 2 * Math.PI); // drawing a circle at the data point for visual clarity
        lastX = x;
        lastY = y;
        dataPoints.push({ x: x, y: y });
    });

    context.strokeStyle = BLUE;
    context.lineWidth = LINE_WIDTH;
    context.stroke();

    // used to determine which point is closest the cursor
    let hoveredPoint = { x: null, y: null };
    let closestDistance = 800;
    let closestIndex = null;
    dataPoints.forEach((point, index) => {
        if (Math.abs(mouseXPosition - point.x) < closestDistance) {
            closestDistance = Math.abs(mouseXPosition - point.x);
            hoveredPoint = { x: point.x, y: point.y };
            closestIndex = index;
        }
    })

    hoveredPointRef.current = { "date": dates[closestIndex], "stat": stats[closestIndex], "point": hoveredPoint }; // getting data for the point we're hovering over

    // only showing hover if we're inside the canvas
    if (isInsideCanvas && hoveredPoint.x >= 0 && hoveredPoint.y >= 0) {
        context.beginPath();
        context.moveTo(hoveredPoint.x, hoveredPoint.y);
        context.arc(hoveredPoint.x, hoveredPoint.y, 2, 0, 2 * Math.PI);
        context.strokeStyle = WHITE_CIRCLE;
        context.fillStyle = WHITE_CIRCLE;
        context.stroke();
    }

    // figuring out which statistic we are actually drawing a graph for
    context.beginPath();
    let statAverage;
    switch (graphOption) {
        case "points":
            statAverage = pts;
            break;
        case "assists":
            statAverage = ast;
            break;
        case "rebounds":
            statAverage = reb;
            break;
        case "blocks":
            statAverage = blk;
            break;
        case "steals":
            statAverage = stl;
            break;
        case "turnovers":
            statAverage = tov;
            break;
        case "fg_pct":
            statAverage = fg_pct;
            break;
        case "3pt_pct":
            statAverage = fg3_pct;
            break;
    }

    // drawing a line at the statistic average
    context.moveTo(0, height - (statAverage * yScale));
    context.lineTo(width, height - (statAverage * yScale));
    context.strokeStyle = RED_LINE;
    context.lineWidth = LINE_WIDTH;
    context.stroke();

    // creating the markers on the y-axis
    context.font = "16px Arial";
    context.fillStyle = "white";
    context.fillText(0, -25, height + 5);
    context.fillText((maxY / 4).toFixed(1), -37, (height / 4) * 3 + 5);
    context.fillText((maxY / 2).toFixed(1), -37, (height / 4) * 2 + 5);
    context.fillText((maxY / 4 * 3).toFixed(1), -37, height / 4 + 5);
    context.fillText(maxY.toFixed(1), -37, 10);

    context.restore();

    // return information to use for hover tooltip
    return {
        show: hoveredPoint.x !== null && hoveredPoint.y !== null,
        x: hoveredPoint.x,
        y: hoveredPoint.y,
        date: dates[closestIndex],
        value: stats[closestIndex]
    };
}
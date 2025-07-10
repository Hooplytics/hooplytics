export const filterRecency = (filterItem, firstGame, lastGame, setStartDate, setEndDate) => {
        const today = lastGame;
        let lastDate;
        if (filterItem === "season") {
            setStartDate(firstGame);
            setEndDate(lastGame);
        } else if (filterItem === "week") {
            lastDate = new Date(today.getTime() - (6 * 24 * 60 * 60 * 1000));
            setStartDate(lastDate);
            setEndDate(today);
        } else if (filterItem === "month") {
            lastDate = new Date(today.getTime() - (4 * 7 * 24 * 60 * 60 * 1000));
            setStartDate(lastDate);
            setEndDate(today);
        }
    }

const granularityInitialPeriods = (filterItem, firstGame) => {
        switch (filterItem) {
            case "week":
                return [firstGame, new Date(firstGame.getTime() + (6 * 24 * 60 * 60 * 1000))];
            case "month":
                return [new Date(firstGame.getFullYear(), firstGame.getMonth(), 1), new Date(firstGame.getFullYear(), firstGame.getMonth() + 1, 0)];
            default:
                return []
        }
    }

const granularityPeriodUpdates = (dates, i, start, end, filterItem) => {
        switch (filterItem) {
            case "week":
                while (dates[i + 1] > end){
                    start = new Date(end.getTime() + (24 * 60 * 60 * 1000));
                    end = new Date(start.getTime() + (6 * 24 * 60 * 60 * 1000));
                };
                return [start, end];
            case "month":
                return [new Date(dates[i + 1].getFullYear(), dates[i + 1].getMonth(), 1), new Date(dates[i + 1].getFullYear(), dates[i + 1].getMonth() + 1, 0)];
            default:
                return []
        }
    }

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

const MARGIN_TR = 20; // margin for top and right
const MARGIN_BL = 40; // margin for bottom and left

export const createGraph = (canvasRef, playerStats, firstGame, filterItem, filterOption, graphOption, pts, ast, reb, blk, stl, tov, fg_pct, fg3_pct) => {
        const stats = filterOption === "recency" ? playerStats.map(game => game[graphOption]) : granularity(playerStats, graphOption, filterItem, firstGame);

        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        const containerHeight = canvas.height;
        const containerWidth = canvas.width;
        context.clearRect(0, 0, containerWidth, containerHeight)

        const height = containerHeight - MARGIN_TR - MARGIN_BL;
        const width = containerWidth - MARGIN_TR - MARGIN_BL;
        const xScale = width / (stats.length - 1)
        
        const maxY = Math.max(...stats);
        const yScale = height / maxY;

        context.save()
        context.translate(MARGIN_BL, MARGIN_TR)

        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, height);
        context.lineTo(width, height);
        context.stroke();
        context.closePath();
        
        let lastX = 0;
        let lastY = 0;
        context.beginPath();
        stats.forEach((stat, index) => {
            const x = xScale * index;
            const y = height - (stat * yScale)
            if (index === 0) {
                context.moveTo(lastX, y);
            } else {
                context.moveTo(lastX, lastY);
            }
            context.lineTo(x, y);
            context.arc(x, y, 2, 0, 2 * Math.PI);
            lastX = x;
            lastY = y;
        });

        context.strokeStyle = "#007bff";
        context.lineWidth = 2;
        context.stroke();

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
        context.moveTo(0, height - (statAverage * yScale));
        context.lineTo(width, height - (statAverage * yScale));
        context.strokeStyle = "#FF0000";
        context.lineWidth = 2;
        context.stroke();

        context.font = "16px Arial";
        context.fillStyle = "white";
        context.fillText(0, -25, height + 5);
        context.fillText((maxY / 4).toFixed(1), -37, (height / 4) * 3 + 5);
        context.fillText((maxY / 2).toFixed(1), -37, (height / 4) * 2 + 5);
        context.fillText((maxY / 4 * 3).toFixed(1), -37, height / 4 + 5);
        context.fillText(maxY.toFixed(1), -37, 10);
    
        context.restore();
    }
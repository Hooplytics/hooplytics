from stats import getPlayerGameLog, getTeamGameLog
from fastapi import HTTPException
import pandas as pd
from datetime import date, datetime
from dateutil.relativedelta import relativedelta

HARDCODED_ENDDATE = date(2025, 4, 14)

async def fetchCache(sb, entity_type, entity_id):
    resp = sb\
        .from_("modal_cache")\
        .select("start_date,end_date,data,last_fetched")\
        .eq("entity_type", entity_type)\
        .eq("entity_id", entity_id)\
        .maybe_single()\
        .execute()
    
    return resp.data if resp and resp.data else None

async def upsert(sb, entity_type, entity_id, startDate, endDate, currEnd, currStart):
    try:
        df = getPlayerGameLog(entity_id, startDate.strftime("%m/%d/%Y"), endDate.strftime("%m/%d/%Y")) if entity_type == "player" else getTeamGameLog(entity_id, startDate.strftime("%m/%d/%Y"), endDate.strftime("%m/%d/%Y"))
    except Exception as e:
        raise HTTPException(502, f"Upstream fetch failed: {e}")
        
    dates = pd.to_datetime(df["GAME_DATE"], format="%b %d, %Y").dt.date
    actual_end = max(dates.max(), currEnd) if currEnd != HARDCODED_ENDDATE else dates.max()
    actual_start = min(dates.min(), currStart) if currEnd != HARDCODED_ENDDATE else actual_end - relativedelta(weeks=4)

    games = [{
        "date":      row["GAME_DATE"],
        "points":    row["PTS"],
        "assists":   row["AST"],
        "rebounds":  row["REB"],
        "blocks":    row["BLK"],
        "steals":    row["STL"],
        "turnovers": row["TOV"],
        "fg_pct":    row["FG_PCT"] * 100,
        "3pt_pct":   row["FG3_PCT"] * 100
    } for _, row in df.iterrows()]

    # upsert into database
    sb.from_("modal_cache")\
        .upsert({
            "entity_type": entity_type,
            "entity_id":   entity_id,
            "start_date":  actual_start.isoformat(),
            "end_date":    actual_end.isoformat(),
            "data":        games,
        }, on_conflict="entity_type,entity_id")\
        .execute()
    
    return games

def queryGames(games, startDate, endDate):
    result = []
    for game in games:
        gameDate = datetime.strptime(game["date"], "%b %d, %Y").date()
        if startDate <= gameDate <= endDate:
            result.append(game)

    return result
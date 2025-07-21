from stats import getPlayerGameLog, getTeamGameLog, additionalPlayerInfo
from fastapi import HTTPException
import pandas as pd
from datetime import date, datetime, timezone
from dateutil.relativedelta import relativedelta

HARDCODED_ENDDATE = date(2025, 4, 14)
ONE_MONTH_BACK = relativedelta(weeks=4)

def playerJson(row, id, additionalInfo):
    return {
        "id": id,
        "name": row["PLAYER_NAME"],
        "team": row["TEAM_ABBREVIATION"],
        "age": row["AGE"],
        "pts": row["PTS"],
        "ast": row["AST"],
        "reb": row["REB"],
        "blk": row["BLK"],
        "stl": row["STL"],
        "tov": row["TOV"],
        "fg_pct": round(row["FG_PCT"] * 100, 1),
        "fg3_pct": round(row["FG3_PCT"] * 100, 1),
        "image_url": f'https://cdn.nba.com/headshots/nba/latest/1040x760/{id}.png',
        **additionalInfo
    }

def teamJson(row, id):
    return {
        "id": id,
        "name": row["TEAM_NAME"],
        "record": f'{row["W"]}-{row["L"]}',
        "pts": int(row["PTS"]),
        "pts_rank": int(row["PTS_RANK"]),
        "ast": int(row["AST"]),        
        "ast_rank": int(row["AST_RANK"]),
        "reb": int(row["REB"]),        
        "reb_rank": int(row["REB_RANK"]),
        "oreb": int(row["OREB"]),       
        "oreb_rank": int(row["OREB_RANK"]),
        "blk": int(row["BLK"]),        
        "blk_rank": int(row["BLK_RANK"]),
        "stl": int(row["STL"]),        
        "stl_rank": int(row["STL_RANK"]),
        "tov": int(row["TOV"]),        
        "tov_rank": int(row["TOV_RANK"]),
        "plus_minus": float(row["PLUS_MINUS"]), 
        "plus_minus_rank": int(row["PLUS_MINUS_RANK"]),
        "fg_pct": round(float(row["FG_PCT"])   * 100, 1), 
        "fg_pct_rank": int(row["FG_PCT_RANK"]),
        "fg3_pct": round(float(row["FG3_PCT"])  * 100, 1), 
        "fg3_pct_rank": int(row["FG3_PCT_RANK"]),
        "oppg": float(row["OPP_PTS"]),   
        "oppg_rank": int(row["OPP_PTS_RANK"]),
        "opp_fg_pct": round(float(row["OPP_FG_PCT"])   * 100, 1), 
        "opp_fg_pct_rank": int(row["OPP_FG_PCT_RANK"]),
        "opp_fg3_pct": round(float(row["OPP_FG3_PCT"])  * 100, 1), 
        "opp_fg3_pct_rank": int(row["OPP_FG3_PCT_RANK"]),
        "opp_reb": float(row["OPP_REB"]),   
        "opp_reb_rank": int(row["OPP_REB_RANK"]),
        "opp_oreb": float(row["OPP_OREB"]),  
        "opp_oreb_rank": int(row["OPP_OREB_RANK"]),
        "opp_tov": float(row["OPP_TOV"]),   "opp_tov_rank":  int(row["OPP_TOV_RANK"]),
        "logo_url": f"https://cdn.nba.com/logos/nba/{id}/global/L/logo.svg",
    }

def dataExtraction(type, filter, name, data):
    row = data[data[filter].str.contains(name, case=False, na=False)]

    info = []
    for _, row in row.iterrows():
        id = int(row["PLAYER_ID"]) if type == "player" else int(row["TEAM_ID"])
        additionalInfo = additionalPlayerInfo(id) if type == "player" else None

        if type == "player":
            info.append(
                playerJson(row, id, additionalInfo)
            )
        elif type == "team":
            info.append(
                teamJson(row, id)
            )

    return info

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
        return []
        
    dates = pd.to_datetime(df["GAME_DATE"], format="%b %d, %Y").dt.date
    actual_end = max(dates.max(), currEnd) if currEnd != HARDCODED_ENDDATE else dates.max()
    actual_start = min(dates.min(), currStart) if currEnd != HARDCODED_ENDDATE else actual_end - ONE_MONTH_BACK

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
            "entity_id": entity_id,
            "start_date": actual_start.isoformat(),
            "end_date": actual_end.isoformat(),
            "data": games,
            "last_fetched": datetime.now(timezone.utc).isoformat()
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
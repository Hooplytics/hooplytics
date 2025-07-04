from stats import getPlayerSeasonStats, getFullTeamStats
from stats import additionalPlayerInfo
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from requests.exceptions import ReadTimeout

app = FastAPI()

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/search/players")
def getPlayers(player: str):
    try:
        players = getPlayerSeasonStats()
    except Exception as e:
        print(f'Error fetching player data: {e}')
        return

    matchedPlayers = players[players["PLAYER_NAME"].str.contains(player, case=False, na=False)]
    playerInfo = []

    for _, row in matchedPlayers.iterrows():
        player_id = int(row["PLAYER_ID"])
        additionalInfo = additionalPlayerInfo(player_id)

        playerInfo.append({
            "id": player_id,
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
            "image_url": f'https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png',
            **additionalInfo  
        })

    return playerInfo

@app.get("/players/{player_id}")
def getPlayer(player_id: int):
    try:
        df = getPlayerSeasonStats()
    except Exception as e:
        print(f'Error fetching player data: {e}')
        return
    
    matched = df[df["PLAYER_ID"] == player_id].iloc[0]
    additionalInfo = additionalPlayerInfo(player_id)
    return ({
            "id": player_id,
            "name": matched["PLAYER_NAME"],
            "team": matched["TEAM_ABBREVIATION"],
            "age": matched["AGE"],
            "pts": matched["PTS"],
            "ast": matched["AST"],
            "reb": matched["REB"],
            "blk": matched["BLK"],
            "stl": matched["STL"],
            "tov": matched["TOV"],
            "fg_pct": round(matched["FG_PCT"] * 100, 1),
            "fg3_pct": round(matched["FG3_PCT"] * 100, 1),
            "image_url": f'https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png',
            **additionalInfo  
    })


@app.get("/search/teams")
def getTeams(team: str):
    try:
        teams = getFullTeamStats() 
    except Exception as e:
        print(f'Error fetching teams: {e}')
        return

    matchedTeams = teams[teams["TEAM_NAME"].str.contains(team, case=False, na=False)]

    teamInfo = []
    for _, row in matchedTeams.iterrows():
        team_id = int(row["TEAM_ID"])
        teamInfo.append({
            "id": team_id,
            "name": row["TEAM_NAME"],
            "record": f'{row["W"]}-{row["L"]}',
            "pts": row["PTS"],        
            "pts_rank": row["PTS_RANK"],
            "ast": row["AST"],
            "ast_rank":row["AST_RANK"],
            "reb": row["REB"],
            "reb_rank": row["REB_RANK"],
            "oreb": row["OREB"],       
            "oreb_rank": row["OREB_RANK"],
            "blk": row["BLK"],        
            "blk_rank": row["BLK_RANK"],
            "stl": row["STL"],        
            "stl_rank": row["STL_RANK"],
            "tov": row["TOV"],        
            "tov_rank": row["TOV_RANK"],
            "plus_minus": row["PLUS_MINUS"], 
            "plus_minus_rank": row["PLUS_MINUS_RANK"],
            "fg_pct": row["FG_PCT"] * 100, 
            "fg_pct_rank": row["FG_PCT_RANK"],
            "fg3_pct": row["FG3_PCT"] * 100, 
            "fg3_pct_rank": row["FG3_PCT_RANK"],
            "oppg": row["OPP_PTS"],   
            "oppg_rank": row["OPP_PTS_RANK"],
            "opp_fg_pct": row["OPP_FG_PCT"] * 100, 
            "opp_fg_pct_rank": row["OPP_FG_PCT_RANK"],
            "opp_fg3_pct": row["OPP_FG3_PCT"] * 100, 
            "opp_fg3_pct_rank": row["OPP_FG3_PCT_RANK"],
            "opp_reb": row["OPP_REB"],   
            "opp_reb_rank": row["OPP_REB_RANK"],
            "opp_oreb": row["OPP_OREB"],  
            "opp_oreb_rank": row["OPP_OREB_RANK"],
            "opp_tov": row["OPP_TOV"],   
            "opp_tov_rank": row["OPP_TOV_RANK"],
            "logo_url": f"https://cdn.nba.com/logos/nba/{team_id}/global/L/logo.svg",
        })

    return teamInfo

@app.get("/teams/{teamid}")
def getTeam(teamid: int):
    try:
        df = getFullTeamStats() 
    except Exception as e:
        print(f'Error fetching teams: {e}')
        return

    matched = df[df["TEAM_ID"] == teamid].iloc[0]
    return ({
        "id": int(matched["TEAM_ID"]),
        "name": matched["TEAM_NAME"],
        "record": f'{matched["W"]}-{matched["L"]}',
        "pts": int(matched["PTS"]),
        "pts_rank": int(matched["PTS_RANK"]),
        "ast": int(matched["AST"]),        
        "ast_rank": int(matched["AST_RANK"]),
        "reb": int(matched["REB"]),        
        "reb_rank": int(matched["REB_RANK"]),
        "oreb": int(matched["OREB"]),       
        "oreb_rank": int(matched["OREB_RANK"]),
        "blk": int(matched["BLK"]),        
        "blk_rank": int(matched["BLK_RANK"]),
        "stl": int(matched["STL"]),        
        "stl_rank": int(matched["STL_RANK"]),
        "tov": int(matched["TOV"]),        
        "tov_rank": int(matched["TOV_RANK"]),
        "plus_minus": float(matched["PLUS_MINUS"]), 
        "plus_minus_rank": int(matched["PLUS_MINUS_RANK"]),
        "fg_pct": round(float(matched["FG_PCT"])   * 100, 1), 
        "fg_pct_rank": int(matched["FG_PCT_RANK"]),
        "fg3_pct": round(float(matched["FG3_PCT"])  * 100, 1), 
        "fg3_pct_rank": int(matched["FG3_PCT_RANK"]),
        "oppg": float(matched["OPP_PTS"]),   
        "oppg_rank": int(matched["OPP_PTS_RANK"]),
        "opp_fg_pct": round(float(matched["OPP_FG_PCT"])   * 100, 1), 
        "opp_fg_pct_rank": int(matched["OPP_FG_PCT_RANK"]),
        "opp_fg3_pct": round(float(matched["OPP_FG3_PCT"])  * 100, 1), 
        "opp_fg3_pct_rank": int(matched["OPP_FG3_PCT_RANK"]),
        "opp_reb": float(matched["OPP_REB"]),   
        "opp_reb_rank": int(matched["OPP_REB_RANK"]),
        "opp_oreb": float(matched["OPP_OREB"]),  
        "opp_oreb_rank": int(matched["OPP_OREB_RANK"]),
        "opp_tov": float(matched["OPP_TOV"]),   "opp_tov_rank":  int(matched["OPP_TOV_RANK"]),
        "logo_url": f"https://cdn.nba.com/logos/nba/{teamid}/global/L/logo.svg",
    })
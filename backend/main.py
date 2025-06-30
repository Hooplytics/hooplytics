from stats import player_season_stats_df as players
from stats import team_season_offensive_stats_df as teamsO
from stats import team_season_defensive_stats_df as teamsD
from stats import additionalPlayerInfo
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
            "PPG": row["PTS"],
            "AST": row["AST"],
            "REB": row["REB"],
            "BLK": row["BLK"],
            "STL": row["STL"],
            "TOV": row["TOV"],
            "FG%": round(row["FG_PCT"] * 100, 1),
            "3P%": round(row["FG3_PCT"] * 100, 1),
            "image_url": f'https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png',
            **additionalInfo  
        })

    return playerInfo


@app.get("/search/teams")
def getTeams(team: str):
    matchedTeamsO = teamsO[teamsO["TEAM_NAME"].str.contains(team, case=False, na=False)]
    matchedTeamsD = teamsD[teamsD["TEAM_NAME"].str.contains(team, case=False, na=False)]
    teamInfo = []
    for _, row in matchedTeamsO.iterrows():
        teamInfo.append({
            "id": row["TEAM_ID"],
            "name": row["TEAM_NAME"],
            "record": f'{row["W"]}-{row["L"]}',
            "PPG": row["PTS"],
            "PPG_RANK": row["PTS_RANK"],
            "AST": row["AST"],
            "AST_RANK": row["AST_RANK"],
            "REB": row["REB"],
            "REB_RANK": row["REB_RANK"],
            "OREB": row["OREB"],
            "OREB_RANK": row["OREB_RANK"],
            "BLK": row["BLK"],
            "BLK_RANK": row["BLK_RANK"],
            "STL": row["STL"],
            "STL_RANK": row["STL_RANK"],
            "TOV": row["TOV"],
            "TOV_RANK": row["TOV_RANK"],
            "PLUS_MINUS": row["PLUS_MINUS"],
            "PLUS_MINUS_RANK": row["PLUS_MINUS_RANK"],
            "FG%": row["FG_PCT"] * 100,
            "FG%_RANK": row["FG_PCT_RANK"],
            "3P%": row["FG3_PCT"] * 100,
            "3P%_RANK": row["FG3_PCT_RANK"],
            "logo_url": f"https://cdn.nba.com/logos/nba/{int(row["TEAM_ID"])}/global/L/logo.svg"
        })
    
    for _, row in matchedTeamsD.iterrows():
        teamInfo.append({
            "OPPG": row["OPP_PTS"],
            "OPPG_RANK": row["OPP_PTS_RANK"],
            "OPP_FG%": row["OPP_FG_PCT"] * 100,
            "OPP_FG%_RANK": row["OPP_FG_PCT_RANK"],
            "OPP_3P%": row["OPP_FG3_PCT"] * 100,
            "OPP_3P%_RANK": row["OPP_FG3_PCT_RANK"],
            "OPP_REB": row["OPP_REB"],
            "OPP_REB_RANK": row["OPP_REB_RANK"],
            "OPP_OREB": row["OPP_OREB"],
            "OPP_OREB_RANK": row["OPP_OREB_RANK"],
            "OPP_TOV": row["OPP_TOV"],
            "OPP_TOV_RANK": row["OPP_TOV_RANK"]
        })

    return teamInfo   
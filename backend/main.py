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


@app.get("/search/teams")
def getTeams(team: str):
    matched_o = teamsO[teamsO["TEAM_NAME"].str.contains(team, case=False, na=False)]
    matched_d = teamsD[teamsD["TEAM_NAME"].str.contains(team, case=False, na=False)]

    d_map = {
        row["TEAM_ID"]: row 
        for _, row in matched_d.iterrows()
    }

    team_info_list = []

    for _, o_row in matched_o.iterrows():
        team_id = int(o_row["TEAM_ID"])
        d_row = d_map.get(team_id)

        info = {
            "id": team_id,
            "name": o_row["TEAM_NAME"],
            "record": f'{o_row["W"]}-{o_row["L"]}',
            "pts": o_row["PTS"],      
            "pts_rank": o_row["PTS_RANK"],
            "ast": o_row["AST"],      
            "ast_rank": o_row["AST_RANK"],
            "reb": o_row["REB"],      
            "reb_rank": o_row["REB_RANK"],
            "oreb": o_row["OREB"],     
            "oreb_rank": o_row["OREB_RANK"],
            "blk": o_row["BLK"],      
            "blk_rank": o_row["BLK_RANK"],
            "stl": o_row["STL"],      
            "stl_rank": o_row["STL_RANK"],
            "tov": o_row["TOV"],      
            "tov_rank": o_row["TOV_RANK"],
            "plus_minus": o_row["PLUS_MINUS"],
            "plus_minus_rank": o_row["PLUS_MINUS_RANK"],
            "fg_pct": o_row["FG_PCT"]  * 100, 
            "fg_pct_rank": o_row["FG_PCT_RANK"],
            "fg3_pct": o_row["FG3_PCT"] * 100, 
            "fg3_pct_rank": o_row["FG3_PCT_RANK"],
            "logo_url": f"https://cdn.nba.com/logos/nba/{team_id}/global/L/logo.svg",
        }

        if d_row is not None:
            info.update({
                "oppg": d_row["OPP_PTS"],
                "oppg_rank": d_row["OPP_PTS_RANK"],
                "opp_fg_pct": d_row["OPP_FG_PCT"]  * 100,
                "opp_fg_pct_rank": d_row["OPP_FG_PCT_RANK"],
                "opp_fg3_pct": d_row["OPP_FG3_PCT"] * 100,
                "opp_fg3_pct_rank": d_row["OPP_FG3_PCT_RANK"],
                "opp_reb": d_row["OPP_REB"],
                "opp_reb_rank": d_row["OPP_REB_RANK"],
                "opp_oreb": d_row["OPP_OREB"],
                "opp_oreb_rank": d_row["OPP_OREB_RANK"],
                "opp_tov": d_row["OPP_TOV"],
                "opp_tov_rank": d_row["OPP_TOV_RANK"],
            })

        team_info_list.append(info)

    return team_info_list
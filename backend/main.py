import pandas as pd

from nba_api.stats.endpoints import playergamelog
from nba_api.stats.endpoints import commonallplayers
from nba_api.stats.endpoints import leaguedashteamstats
from nba_api.stats.endpoints import commonteamyears


resp = commonallplayers.CommonAllPlayers(
    is_only_current_season=1,
    season='2024-25'         
)
players_df = resp.get_data_frames()[0]

teams_df = commonteamyears.CommonTeamYears().get_data_frames()[0]
current_teams_df = teams_df[teams_df["MAX_YEAR"] == "2025"]
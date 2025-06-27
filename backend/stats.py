import pandas as pd

from nba_api.stats.library.http import NBAStatsHTTP
from nba_api.stats.endpoints import playergamelog
from nba_api.stats.endpoints import commonplayerinfo
from nba_api.stats.endpoints import leaguedashteamstats
from nba_api.stats.endpoints import commonteamyears
from nba_api.stats.endpoints import leaguedashplayerstats

NBAStatsHTTP.headers = {
    "User-Agent":      "Mozilla/5.0",          # mimic a real browser
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token":  "true",
    "Referer":          "https://www.nba.com",
}

teams_df = commonteamyears.CommonTeamYears().get_data_frames()[0]
current_teams_df = teams_df[teams_df["MAX_YEAR"] == "2025"]

player_season_stats_df = leaguedashplayerstats.LeagueDashPlayerStats(
    season='2024-25',
    per_mode_detailed='PerGame'
).get_data_frames()[0]


team_season_offensive_stats_df = leaguedashteamstats.LeagueDashTeamStats(
    per_mode_detailed="PerGame",
    season="2024-25",
    measure_type_detailed_defense="Base"
).get_data_frames()[0]

team_season_defensive_stats_df = leaguedashteamstats.LeagueDashTeamStats(
    per_mode_detailed="PerGame",
    season="2024-25",
    measure_type_detailed_defense="Opponent"
).get_data_frames()[0]

def additionalPlayerInfo(player_id):
    info_df = commonplayerinfo.CommonPlayerInfo(player_id=player_id).get_data_frames()[0]
    return {
        "position": info_df["POSITION"].values[0],
        "height": info_df["HEIGHT"].values[0],
        "weight": info_df["WEIGHT"].values[0]
    }
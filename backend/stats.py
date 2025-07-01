from nba_api.stats.library.http import NBAStatsHTTP
from nba_api.stats.endpoints import commonplayerinfo, leaguedashplayerstats, leaguedashteamstats
from functools import lru_cache

NBAStatsHTTP.headers = {
    "User-Agent":      "Mozilla/5.0",        
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token":  "true",
    "Referer":          "https://www.nba.com",
}

@lru_cache(maxsize=1)
def getPlayerSeasonStats():
    return leaguedashplayerstats.LeagueDashPlayerStats(
        season='2024-25',
        per_mode_detailed='PerGame'
    ).get_data_frames()[0]

@lru_cache(maxsize=1)
def getTeamStats():
    return leaguedashteamstats.LeagueDashTeamStats(
        per_mode_detailed="PerGame",
        season="2024-25",
        measure_type_detailed_defense="Base"
    ).get_data_frames()[0]

@lru_cache(maxsize=1)
def getTeamOppStats():
    return leaguedashteamstats.LeagueDashTeamStats(
        per_mode_detailed="PerGame",
        season="2024-25",
        measure_type_detailed_defense="Opponent"
    ).get_data_frames()[0]

def additionalPlayerInfo(player_id):
    info_df = commonplayerinfo.CommonPlayerInfo(player_id=player_id).get_data_frames()[0]
    return {
        "position": info_df["POSITION"].values[0],
        "height": f'{info_df["HEIGHT"].values[0][0]}\'{info_df["HEIGHT"].values[0][2]}\"',
        "weight": info_df["WEIGHT"].values[0]
    }
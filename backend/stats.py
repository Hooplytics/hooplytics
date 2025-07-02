from nba_api.stats.endpoints import commonplayerinfo, leaguedashplayerstats, leaguedashteamstats
from functools import lru_cache

currSeason = '2024-25'

@lru_cache(maxsize=1)
def getPlayerSeasonStats():
    return leaguedashplayerstats.LeagueDashPlayerStats(
        season=currSeason,
        per_mode_detailed='PerGame'
    ).get_data_frames()[0]

@lru_cache(maxsize=1)
def getTeamStats():
    return leaguedashteamstats.LeagueDashTeamStats(
        per_mode_detailed="PerGame",
        season=currSeason,
        measure_type_detailed_defense="Base"
    ).get_data_frames()[0]

@lru_cache(maxsize=1)
def getTeamOppStats():
    return leaguedashteamstats.LeagueDashTeamStats(
        per_mode_detailed="PerGame",
        season=currSeason,
        measure_type_detailed_defense="Opponent"
    ).get_data_frames()[0]

@lru_cache(maxsize=1)
def getFullTeamStats():
    off_df = getTeamStats()    
    opp_df = getTeamOppStats()
    opp_df = opp_df.drop(columns=["TEAM_NAME", "W", "L", "PLUS_MINUS", "PLUS_MINUS_RANK"])

    return off_df.merge(
        opp_df,
        on="TEAM_ID",
        how="outer"
    )

def additionalPlayerInfo(player_id):
    info_df = commonplayerinfo.CommonPlayerInfo(player_id=player_id).get_data_frames()[0]
    return {
        "position": info_df["POSITION"].values[0],
        "height": f'{info_df["HEIGHT"].values[0][0]}\'{info_df["HEIGHT"].values[0][2]}\"',
        "weight": info_df["WEIGHT"].values[0]
    }
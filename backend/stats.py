from nba_api.stats.endpoints import commonplayerinfo, leaguedashplayerstats, leaguedashteamstats, playergamelog, teamgamelog
from functools import lru_cache

currSeason = '2024-25'

@lru_cache(maxsize=1)
def getPlayerSeasonStats():
    return leaguedashplayerstats.LeagueDashPlayerStats(
        season=currSeason,
        per_mode_detailed='PerGame'
    ).get_data_frames()[0]

@lru_cache(maxsize=1)
def getFullTeamStats():
    off_df = leaguedashteamstats.LeagueDashTeamStats(
        per_mode_detailed="PerGame",
        season=currSeason,
        measure_type_detailed_defense="Base"
    ).get_data_frames()[0]  
    opp_df = leaguedashteamstats.LeagueDashTeamStats(
        per_mode_detailed="PerGame",
        season=currSeason,
        measure_type_detailed_defense="Opponent"
    ).get_data_frames()[0]
    opp_df = opp_df.drop(columns=["TEAM_NAME", "W", "L", "PLUS_MINUS", "PLUS_MINUS_RANK"])

    return off_df.merge(
        opp_df,
        on="TEAM_ID",
        how="outer"
    )

def getPlayerGameLog(id, startDate, endDate):
    return playergamelog.PlayerGameLog(
        season=currSeason,
        player_id=id,
        date_from_nullable = startDate,
        date_to_nullable = endDate
    ).get_data_frames()[0]

def getTeamGameLog(id, startDate, endDate):
    return teamgamelog.TeamGameLog(
        season=currSeason,
        team_id=id,
        date_from_nullable = startDate,
        date_to_nullable = endDate
    ).get_data_frames()[0]

def additionalPlayerInfo(player_id):
    info_df = commonplayerinfo.CommonPlayerInfo(player_id=player_id).get_data_frames()[0]
    return {
        "position": info_df["POSITION"].values[0],
        "height": f'{info_df["HEIGHT"].values[0][0]}\'{info_df["HEIGHT"].values[0][2]}\"',
        "weight": info_df["WEIGHT"].values[0]
    }
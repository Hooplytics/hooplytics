from nba_api.stats.endpoints import commonplayerinfo, teaminfocommon, leaguedashplayerstats, leaguedashteamstats, playergamelog, teamgamelog
from nba_api.stats.static import teams
from supabase import create_client
from configuration import SUPABASE_URL, SUPABASE_ANON_KEY
from functools import lru_cache

currSeason = '2024-25'

@lru_cache(maxsize=1)
def getPlayerSeasonStats():
    return leaguedashplayerstats.LeagueDashPlayerStats(
        league_id_nullable="00",
        season=currSeason,
        per_mode_detailed='PerGame'
    ).get_data_frames()[0]

@lru_cache(maxsize=1)
def getFullTeamStats():
    off_df = leaguedashteamstats.LeagueDashTeamStats(
        league_id_nullable="00",
        per_mode_detailed="PerGame",
        season=currSeason,
        measure_type_detailed_defense="Base"
    ).get_data_frames()[0]  
    opp_df = leaguedashteamstats.LeagueDashTeamStats(
        league_id_nullable="00",
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
        league_id_nullable="00",
        season=currSeason,
        player_id=id,
        date_from_nullable = startDate,
        date_to_nullable = endDate
    ).get_data_frames()[0]

def getTeamGameLog(id, startDate, endDate):
    return teamgamelog.TeamGameLog(
        league_id_nullable="00",
        season=currSeason,
        team_id=id,
        date_from_nullable = startDate,
        date_to_nullable = endDate
    ).get_data_frames()[0]

def additionalPlayerInfo(player_id):
    info_df = commonplayerinfo.CommonPlayerInfo(player_id=player_id) \
                .get_data_frames()[0]

    rawHeight = info_df["HEIGHT"].iat[0] or ""

    # split if there is a dash
    if "-" in rawHeight:
        feet, inches = rawHeight.split("-", 1)
    # split if there is a space
    elif " " in rawHeight:
        parts = rawHeight.split()

        nums = [p for p in parts if p.isdigit()]
        if len(nums) >= 2:
            feet, inches = nums[0], nums[1]
        else:
            feet, inches = "", ""
    else:
        feet, inches = "", ""

    height_formatted = f"{feet}'{inches}\"" if feet and inches else rawHeight

    return {
        "position": info_df["POSITION"].iat[0],
        "height":   height_formatted,
        "weight":   info_df["WEIGHT"].iat[0],
    }

# * UNCOMMENT THIS TO UPDATE NBA TEAM CHARACTERISTICS
# def loadNbaTeams():
#     sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

#     teamData = teams.get_teams()
#     for team in teamData[28:]:
#         id = team["id"]
#         city = team["city"]
#         state = team["state"]

#         additionalData = teaminfocommon.TeamInfoCommon(
#             team_id=id, 
#             league_id="00").get_data_frames()[0]
#         print(additionalData)
#         division   = additionalData["TEAM_DIVISION"].iloc[0]
#         conference = additionalData["TEAM_CONFERENCE"].iloc[0]
#         abbreviation       = additionalData["TEAM_ABBREVIATION"].iloc[0]

#         sb.from_("nba_teams")\
#             .upsert({
#                 "id": id,
#                 "abbreviation": abbreviation,
#                 "city": city,
#                 "state": state,
#                 "division": division,
#                 "conference": conference
#                 }, on_conflict="id")\
#             .execute()

# def main():
#     loadNbaTeams()

# if __name__ == "__main__":
#     main()
from configuration import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEAM_ABBREVIATIONS, NORMALIZE_KEYS, FEATURE_ORDER
import pandas as pd
from stats import getFullTeamStats
from datetime import datetime
from supabase import create_client

def getOpponentPointAllowed(dict):
    teamAverages = getFullTeamStats()
    for _, team in teamAverages.iterrows():
        key = team["TEAM_NAME"]
        value = team["OPP_PTS"]
        dict[key] = value

def playerPositionInfo(position):
    return {
        "guard": int(position == "Guard"), 
        "guard_forward": int(position == "Guard-Forward"), 
        "forward_guard": int(position == "Forward-Guard"), 
        "forward": int(position == "Forward"), 
        "forward_center": int(position == "Forward-Center"), 
        "center_forward": int(position == "Center-Forward"), 
        "center": int(position == "Center")
    }

def opponentOppgInfo(matchup, teamOppg):
    opponentAbbreviation = matchup[2]
    opponentName = TEAM_ABBREVIATIONS[opponentAbbreviation]
    opponentOppg = teamOppg[opponentName] # * opponent's oppg for feature

    return opponentOppg

def seasonPeriodInfo(seasonPeriod):
    return {
        "season_begin": int(seasonPeriod == "season_begin"),
        "season_middle": int(seasonPeriod == "season_middle"),
        "season_end": int(seasonPeriod == "season_end")
    }

def restDaysInfo(prevGameDate, game):
    daysBetween = 100 # * default value to use for feature in case it's the first game of the season
    if prevGameDate:
        currDate = datetime.strptime(game["GAME_DATE"], "%b %d, %Y")
        daysBetween = (currDate - prevGameDate).days # * value of rest between games for feature 
    
    return daysBetween

def upsertPredictionData(sb, id, dates, features, targets):
    sb.\
        from_("raw_data")\
        .upsert({
            "player_id": id,
            "game_dates": dates,
            "features": features,
            "targets": targets
        }, on_conflict="player_id")\
        .execute()

def fetchPredictionData(sb):
    resp = sb.\
        from_("normalized_data")\
        .select("features,targets")\
        .execute()
    
    return resp.data if resp and resp.data else None

def convertDataToDataFrame(resp):
    games = resp.data
    allFeatures = []
    for game in games:
        player_id = game["player_id"]
        for feature in game["features"]:
            featureCopy = feature.copy()
            featureCopy["player_id"] = player_id
            allFeatures.append(featureCopy)

    return pd.DataFrame(allFeatures)

def normalizeData(sb, players, means, stdDevs):
    # normalizing features for every game for every player
    # if it every times out, just change the starting range of data
    for player in players:
        player_id = player["player_id"]
        normalizedFeatures = []

        for feature in player["features"]:
            normalizedFeature = {}

            # normalizing and adding weight to continuous values
            for key in NORMALIZE_KEYS:
                z = (feature[key] - means[key]) / stdDevs[key]
                normalizedFeature[key] = z

            # adding weight to binary values
            for key, value in feature.items():
                if key not in NORMALIZE_KEYS:
                    normalizedFeature[key] = value

            normalizedFeatures.append(normalizedFeature)
            print(f'Finished normalizing features for a player') # keeping this so that when updating weighed data we know when we've finished calculating all the features for a player

        sb.from_("normalized_data")\
            .upsert({
                "player_id": player_id,
                "game_dates": player["game_dates"],
                "features": normalizedFeatures,
                "targets": player["targets"]
            }, on_conflict="player_id")\
            .execute() 
        print(f'Upserted normalized features for a player') # keeping this so that when updating weighed data we know when a player's features are upserted into the database

def getMeansAndStdDevs(sb):
    resp = sb.from_("raw_data")\
        .select("player_id, game_dates, features, targets")\
        .execute()
    
    # create a data frame because it will be easier to normalize
    df = convertDataToDataFrame(resp)

    # getting means and std deviations for each feature that we're normalizing
    means = df[NORMALIZE_KEYS].mean()
    stdDevs  = df[NORMALIZE_KEYS].std(ddof=0)
    return [resp, means, stdDevs]

def normalizeInput(feature, means, stdDevs):
    normalizedFeature = {}

    # normalizing and adding weight to continuous values
    for key in NORMALIZE_KEYS:
        z = (feature[key] - means[key]) / stdDevs[key]
        normalizedFeature[key] = z

    # adding weight to binary values
    for key, value in feature.items():
        if key not in NORMALIZE_KEYS:
            normalizedFeature[key] = value
    
    return normalizedFeature

def getInteractionAverages():
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    resp = sb.from_("user_interactions")\
        .select("point_count,date_count,position_count")\
        .execute()
    
    data = resp.data

    n = len(data)
    return {
        "position": sum(row["position_count"] for row in data) / n,
        "date": sum(row["date_count"] for row in data) / n,
        "point": sum(row["point_count"] for row in data) / n
    }

def getUserInteractions(sb, averages, user_id):
    resp = sb.from_("user_interactions")\
        .select("point_count,date_count,position_count")\
        .eq("user_id", user_id)\
        .single()\
        .execute()
    
    data = resp.data
    return {
        "position": data["position_count"] / averages["position"],
        "date": data["date_count"] / averages["date"],
        "point": data["point_count"] / averages["point"]
    }

def getUserWeights(userId, userInteractions):
    weights = {
        "seasonAverage": 3.00,
        "last7GameAvg": 4.00,
        "restDays": 1.00,
        "opponentPointsAllowed": 2.00,
        "home": 1.00,
        "season_begin": 1.00,
        "season_middle": 1.00,
        "season_end": 1.00,
        "guard": 1.25,
        "guard_forward": 1.25,
        "forward_guard": 1.25,
        "forward": 1.25,
        "forward_center": 1.25,
        "center_forward": 1.25,
        "center": 1.25,
    }

    if userId:
        categoriesMap = {
            "point": ["seasonAverage", "last7GameAvg"],
            "date": ["season_begin", "season_middle", "season_end"],
            "position": [ "guard", "guard_forward", "forward_guard", "forward", "forward_center", "center_forward", "center"],
        }

        for interaction in userInteractions:
            for category in categoriesMap[interaction]:
                weights[category] *= userInteractions[interaction]

    orderedWeights = []
    for category in FEATURE_ORDER:
        orderedWeights.append(weights[category] * 0.5) # we only want the user weight to be half of the final weight

    return orderedWeights
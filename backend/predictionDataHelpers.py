import pandas as pd
from stats import getFullTeamStats
from datetime import datetime

monthlyPeriods = {
    "OCT": "season_begin",
    "NOV": "season_begin",
    "DEC": "season_middle",
    "JAN": "season_middle",
    "FEB": "season_middle",
    "MAR": "season_end",
    "APR": "season_end"
}

teamAbbreviations = {
    "ATL": "Atlanta Hawks",
    "BOS": "Boston Celtics",
    "BKN": "Brooklyn Nets",
    "CHA": "Charlotte Hornets",
    "CHI": "Chicago Bulls",
    "CLE": "Cleveland Cavaliers",
    "DAL": "Dallas Mavericks",
    "DEN": "Denver Nuggets",
    "DET": "Detroit Pistons",
    "GSW": "Golden State Warriors",
    "HOU": "Houston Rockets",
    "IND": "Indiana Pacers",
    "LAC": "LA Clippers",
    "LAL": "Los Angeles Lakers",
    "MEM": "Memphis Grizzlies",
    "MIA": "Miami Heat",
    "MIL": "Milwaukee Bucks",
    "MIN": "Minnesota Timberwolves",
    "NOP": "New Orleans Pelicans",
    "NYK": "New York Knicks",
    "OKC": "Oklahoma City Thunder",
    "ORL": "Orlando Magic",
    "PHI": "Philadelphia 76ers",
    "PHX": "Phoenix Suns",
    "POR": "Portland Trail Blazers",
    "SAC": "Sacramento Kings",
    "SAS": "San Antonio Spurs",
    "TOR": "Toronto Raptors",
    "UTA": "Utah Jazz",
    "WAS": "Washington Wizards"
}

normalizeKeys = [
    "seasonAverage", 
    "last7GameAvg", 
    "restDays", 
    "opponentPointsAllowed"
]

featureWeights = {
    "seasonAverage": 5.00,
    "last7GameAvg": 3.00,
    "restDays": 1.00,
    "opponentPointsAllowed": 2,
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
    opponentName = teamAbbreviations[opponentAbbreviation]
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
        from_("weighted_data")\
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

def normalizeAndWeighData(sb, players, means, stdDevs):
    # normalizing features for every game for every player
    # if it every times out, just change the starting range of data
    for player in players:
        player_id = player["player_id"]
        weightedFeatures = []

        for feature in player["features"]:
            weightedFeature = {}

            # normalizing and adding weight to continuous values
            for key in normalizeKeys:
                z = (feature[key] - means[key]) / stdDevs[key]
                weightedFeature[key] = z * featureWeights.get(key, 1.0)

            # adding weight to binary values
            for key, value in feature.items():
                if key not in normalizeKeys:
                    weightedFeature[key] = value * featureWeights.get(key, 1.0)

            weightedFeatures.append(weightedFeature)
            print(f'Finished weighing features for a player') # keeping this so that when updating weighed data we know when we've finished calculating all the features for a player

        sb.from_("weighted_data")\
            .upsert({
                "player_id": player_id,
                "game_dates": player["game_dates"],
                "features": weightedFeatures,
                "targets": player["targets"]
            }, on_conflict="player_id")\
            .execute() 
        print(f'Upserted weighed features for a player') # keeping this so that when updating weighed data we know when a player's features are upserted into the database

def getMeansAndStdDevs(sb):
    resp = sb.from_("raw_data")\
        .select("player_id, game_dates, features, targets")\
        .execute()
    
    # create a data frame because it will be easier to normalize
    df = convertDataToDataFrame(resp)

    # getting means and std deviations for each feature that we're normalizing
    means = df[normalizeKeys].mean()
    stdDevs  = df[normalizeKeys].std(ddof=0)
    return [resp, means, stdDevs]

def weighInput(feature, means, stdDevs):
    weightedFeature = {}

    # normalizing and adding weight to continuous values
    for key in normalizeKeys:
        z = (feature[key] - means[key]) / stdDevs[key]
        weightedFeature[key] = z * featureWeights.get(key, 1.0)

    # adding weight to binary values
    for key, value in feature.items():
        if key not in normalizeKeys:
            weightedFeature[key] = value * featureWeights.get(key, 1.0)
    
    return weightedFeature
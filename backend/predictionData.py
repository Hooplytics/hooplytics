# [season ppg avg, last 7 game ppg avg (running for first 7 games), home or away, days between games, opp defensive rating, season_beginning, season_middle, season_end, g, g-f, f-g, f, f-c, c]
from stats import getPlayerGameLog, additionalPlayerInfo, getPlayerSeasonStats
from predictionDataHelpers import playerPositionInfo, restDaysInfo, opponentOppgInfo, seasonPeriodInfo, monthlyPeriods, convertDataToDataFrame, normalizeData, getOpponentPointAllowed, upsertPredictionData, getMeansAndStdDevs
from collections import deque
from datetime import datetime
from supabase import create_client
import os
from dotenv import load_dotenv

def getPlayerFeatureData(player, i, teamOppg):
    values = []
    features = []

    seasonPpg = player["PTS"] # * season ppg to use in feature

    # * using one hot encoding to determine position values for feature
    position = additionalPlayerInfo(player["PLAYER_ID"])["position"]
    positionFeature = playerPositionInfo(position)

    games = getPlayerGameLog(player["PLAYER_ID"], "10/15/2024", "04/15/2025").iloc[::-1].reset_index(drop=True)

    currPoints = deque([]) # points in the current window
    dates = []
    prevGameDate = None
    for _, game in games.iterrows():
        curr_date = datetime.strptime(game["GAME_DATE"], "%b %d, %Y")
        dates.append(curr_date.date().isoformat())

        if (len(currPoints) == 7):
            currPoints.popleft() # removing oldest game points if out of window

        pointsScored = game["PTS"]
        values.append(pointsScored) # actual value scored this game
        currPoints.append(pointsScored)
        windowAverage = sum(currPoints) / len(currPoints) # * last 7 games ppg average (running average for first 7 games)

        matchup = game["MATCHUP"].split(" ")
        home = 1 if matchup[1] == "vs." else 0 # * home binary value for feature 

        restDaysFeature = restDaysInfo(prevGameDate, game)
        prevGameDate = datetime.strptime(game["GAME_DATE"], "%b %d, %Y")
        opponentOpgFeature = opponentOppgInfo(matchup, teamOppg)
        
        # * using one hot encoding to figure out season period for feature
        month = game["GAME_DATE"].split(" ")[0]
        seasonPeriod = monthlyPeriods[month]
        seasonPeriodFeature = seasonPeriodInfo(seasonPeriod)

        features.append({
            "seasonAverage": seasonPpg, 
            "last7GameAvg": windowAverage,
            "home": home,
            "restDays": restDaysFeature,
            "opponentPointsAllowed": opponentOpgFeature,
            **seasonPeriodFeature,
            **positionFeature
        })
    print(f'Finished feature for player {i+1}: {player["PLAYER_NAME"]}') # keeping this so that when updating raw data we know when we've finished calculating all the features for a player
    return [features, values, dates]

def normalizingPredictionData(sb):
    resp, means, stdDevs = getMeansAndStdDevs(sb)

    normalizeData(sb, resp.data, means, stdDevs)

def main():
    load_dotenv()
    SUPABASE_URL    = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

    sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    team_opp_pts = {}
    getOpponentPointAllowed(team_opp_pts)

    # go through as many players as possible until times out
    # change start value after every timeout
    # * UNCOMMENT THIS TO UPDATE RAW DATA TABLE
    # players = getPlayerSeasonStats().iloc[0:]
    # for i, player in players.iterrows():
    #     features, targets, dates = getPlayerFeatureData(player, i, team_opp_pts)
    #     upsertPredictionData(sb, player["PLAYER_ID"], dates, features, targets)
    #     print(f'Upserted player {player["PLAYER_NAME"]}') # keeping this so that when updating raw data we know when a game is upserted into the database
    # # * UNCOMMENT THIS TO UPDATE WEIGHTED DATA TABLE
    normalizingPredictionData(sb)

if __name__ == "__main__":
    main()
from configuration import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, MULTIPLE_SIMILAR, ONE_SIMILAR, MULTIPLE_SIMILAR_PLAYER_TEAMS, ONE_SIMILAR_PLAYER_TEAM, SAME_CITY, SAME_STATE, SAME_DIVISION, SAME_CONFERENCE, SIMILAR_PPG, SIMILAR_POSITION, SIMILAR_INTERACTION, NEIGHBORING_INTERACTION
from predictionDataHelpers import getUserWeights, getUserInteractions
from stats import additionalPlayerInfo, getPlayerSeasonStats
from modalHelpers import playerJson
from supabase import create_client
import numpy as np

# combining all the functions that I have to determine the values for weights based on similar user groups
def getSimilarUserWeights(activeUser, interactionAverages):
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) # we need the service role key to override RLS
    users = getUsers()
    favoriteCountAverage = getFavoriteCountAverage(len(users))
    
    # getting necessary variables for the user that is currently logged in
    activePlayers, activeTeams, activeCities, activeStates, activeDivisions, activeConferences, activePositions, activePlayerTeams, activePoints, activeFavoriteRatio, activeUserInteractions, activeUserTotalInteractionsRatio = getUserValues(activeUser, sb, interactionAverages, favoriteCountAverage)

    teamHeuristics = []
    playerHeuristics = []
    usageHeuristics = []
    interactionHeuristics = []
    for currUser in users:
        if currUser == activeUser:
            continue
        
        # getting necessary variables for all users that are not the currently logged in user
        currPlayers, currTeams, currCities, currStates, currDivisions, currConferences, currPositions, currPlayerTeams, currPoints, currFavoriteRatio, currUserInteractions, currUserTotalInteractionsRatio = getUserValues(currUser, sb, interactionAverages, favoriteCountAverage)

        # calculating heuristic values for each user
        teamHeuristics.append(calculateTeamHeuristic(activeTeams, activeCities, activeStates, activeDivisions, activeConferences, activePlayerTeams, currTeams, currCities, currStates, currDivisions, currConferences, currPlayerTeams))
        playerHeuristics.append(calculatePlayerHeuristic(activePlayers, activePoints, activePositions, activePlayerTeams, currPlayers, currPoints, currPositions, currPlayerTeams))
        usageHeuristics.append(calculateUsageHeuristic(activeFavoriteRatio, activeUserTotalInteractionsRatio, currFavoriteRatio, currUserTotalInteractionsRatio))
        interactionHeuristics.append(calculateInteractionHeuristic(activeUserInteractions, currUserInteractions))
    
    # normalizing all the heuristic values for each user
    normalizedTeamHeuristics = normalizeArrayData(teamHeuristics)
    normalizedPlayerHeuristics = normalizeArrayData(playerHeuristics)
    normalizedUsageHeuristics = normalizeArrayData(usageHeuristics)
    normalizedInteractionHeuristics = normalizeArrayData(interactionHeuristics)

    # adding up each user's heuristic values
    totalHeuristicWeights = []
    for i in range(len(teamHeuristics)):
        totalHeuristicWeights.append(normalizedTeamHeuristics[i] + normalizedPlayerHeuristics[i] + normalizedUsageHeuristics[i] + normalizedInteractionHeuristics[i])
    
    # creating a dictionary that matches user id to total heuristic value
    matched = {}
    foundActiveUser = 0
    for i in range(len(users)):
        if users[i] == activeUser:
            foundActiveUser = 1
            continue
        
        matched[users[i]] = totalHeuristicWeights[i - foundActiveUser]
    
    topSimilar = sorted(matched.items(), key=lambda kv: kv[1], reverse=True)[:5] # getting top 5 similar but can change this value
    
    # adding the total weights for each similar user
    similarWeights = []
    for user in topSimilar:
        userInteractions = getUserInteractions(sb, interactionAverages, user[0])
        userWeights = getUserWeights(user[0], userInteractions)
        similarWeights = [a + b for a, b in zip(similarWeights, userWeights)] if len(similarWeights) > 0 else userWeights
    
    return [num / len(topSimilar) * 0.5 for num in similarWeights] # returning the average of all similar weights * 0.5 (0.5 because we want similar weights to hold 50% weight for final user weight)

# get all the values that I need for both active users and non-active users
def getUserValues(user, sb, interactionAverages, favoriteAverage):
    players, teams = getActiveUserFavorites(user)
    cities, states, divisions, conferences = getFavoriteTeamInfo(teams)
    positions, playerTeams, points = getFavoritePlayerInfo(players)
    favoriteRatio = (len(players) + len(teams)) / favoriteAverage
    userInteractions = getUserInteractions(sb, interactionAverages, user)
    userTotalInteractionsRatio = sum(userInteractions.values()) / sum(interactionAverages.values())

    return [players, teams, cities, states, divisions, conferences, positions, playerTeams, points, favoriteRatio, userInteractions, userTotalInteractionsRatio]

# calculating the points value for similar favorite teams
def calculateTeamHeuristic(activeTeams, activeCities, activeStates, activeDivisions, activeConferences, activePlayerTeams, currTeams, currCities, currStates, currDivisions, currConferences, currPlayerTeams):
    similarTeams = activeTeams & currTeams
    if len(similarTeams) > 1:
        return MULTIPLE_SIMILAR
    elif len(similarTeams) == 1:
        return ONE_SIMILAR
    
    # everything from here on becomes more generalized so we want to return the value associated with the most specific relationship
    # each conference has 3 divisions, in each division are 5 teams
    # teams in the same city are in the same division
    # teams that are in the same state are also in the same division
    # basically if a team is in the same city, they are by automatically a part of the same state, division, and conference
    # same logic applies for any level moving outwards
    similarPlayerTeams = activePlayerTeams & currPlayerTeams
    if len(similarPlayerTeams) > 1:
        return MULTIPLE_SIMILAR_PLAYER_TEAMS[0]
    elif len(similarPlayerTeams) == 1:
        return ONE_SIMILAR_PLAYER_TEAM[0]
    
    similarCities = activeCities & currCities
    if len(similarCities) >= 1:
        return SAME_CITY
    
    similarStates = activeStates & currStates
    if len(similarStates) >= 1:
        return SAME_STATE

    similarDivisions = activeDivisions & currDivisions
    if len(similarDivisions) >= 1:
        return SAME_DIVISION
    
    similarConferences = activeConferences & currConferences
    if len(similarConferences) >= 1:
        return SAME_CONFERENCE
    
    return 0

# calculating the points value for similar favorite players
def calculatePlayerHeuristic(activePlayers, activePoints, activePositions, activePlayerTeams, currPlayers, currPoints, currPositions, currPlayerTeams):
    similarPlayers = activePlayers & currPlayers
    if len(similarPlayers) > 1:
        return MULTIPLE_SIMILAR
    elif len(similarPlayers) == 1:
        return ONE_SIMILAR
    
    # points are more general than the following so we don't want to worry about anything else if this is similar between players
    for point in currPoints:
        for average in activePoints:
            if abs(average - point) <= 3:
                return SIMILAR_PPG
    
    # position is more indicative of similarity than same team so if this holds we don't want to continue
    similarPositions = activePositions & currPositions
    if len(similarPositions) == 1:
        return SIMILAR_POSITION
    
    similarPlayerTeams = activePlayerTeams & currPlayerTeams
    if len(similarPlayerTeams) > 1:
        return MULTIPLE_SIMILAR_PLAYER_TEAMS[1]
    elif len(similarPlayerTeams) == 1:
        return ONE_SIMILAR_PLAYER_TEAM[1]
    
# calculating the points value based on similar usages (interaction and favorite counts)
def calculateUsageHeuristic(activeFavoriteRatio, activeUserTotalInteractionsRatio, currFavoriteRatio, currUserTotalInteractionsRatio):
    # calculating the ratio category for active user and non-active user for both favorite and interaction total
    activeFavoriteCategory = getInteractionCategory(activeFavoriteRatio)
    currFavoriteCategory = getInteractionCategory(currFavoriteRatio)
    activeUserTotalInteractionCategory = getInteractionCategory(activeUserTotalInteractionsRatio)
    currUserTotalInteractionCategory = getInteractionCategory(currUserTotalInteractionsRatio)

    # determining total points based on similarity or neighboring categories for both favorite and total interaction
    points = 0
    if activeFavoriteCategory == currFavoriteCategory:
        points += SIMILAR_INTERACTION[0]
    elif activeFavoriteCategory == "average" or currFavoriteCategory == "average":
        points += NEIGHBORING_INTERACTION[0]
    if activeUserTotalInteractionCategory == currUserTotalInteractionCategory:
        points += SIMILAR_INTERACTION[0]
    elif activeUserTotalInteractionCategory == "average" or currUserTotalInteractionCategory == "average":
        points += NEIGHBORING_INTERACTION[0]
    
    return points

# calculating the points value based on similar per-interaction usages
def calculateInteractionHeuristic(activeUserInteractions, currUserInteractions):
    points = 0
    # getting total interaction points based on similar or neighboring category for each interaction type
    for category in activeUserInteractions:
        activeUserInteractionsCategory = getInteractionCategory(activeUserInteractions[category])
        currUserInteractionsCategory = getInteractionCategory(currUserInteractions[category])

        if activeUserInteractionsCategory == currUserInteractionsCategory:
            points += SIMILAR_INTERACTION[1]
        elif activeUserInteractionsCategory == "average" or currUserInteractionsCategory == "average":
            points += NEIGHBORING_INTERACTION[1]

    return points

# normalize a given array of data
def normalizeArrayData(data):
    numpyData = np.array(data)
    mean = numpyData.mean()
    stdDev = numpyData.std(ddof=0)

    if not stdDev:
        return [0 for point in data]
    
    normalizedData = (numpyData - mean) / stdDev
    return normalizedData.tolist()

# get all the favorites for a given user
def getActiveUserFavorites(user_id):
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    resp = sb.from_("favorites")\
        .select("target_id, target_type")\
        .eq("user_id", user_id)\
        .execute()
    favorites = resp.data

    players = set()
    teams = set()
    for favorite in favorites:
        if favorite["target_type"] == "player":
            players.add(favorite["target_id"])
        else:
            teams.add(favorite["target_id"])
        
    return [players, teams]

# get the average favorite count across all users
def getFavoriteCountAverage(userCount):
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    resp = sb.from_("favorites")\
        .select("user_id")\
        .execute()
    
    data = resp.data
    userCounts = {}
    for favorite in data:
        userCounts[favorite["user_id"]] = userCounts[favorite["user_id"]] + 1 if favorite["user_id"] in userCounts else 1
    
    return sum(userCounts.values()) / userCount

# get all the information that I need from favorited players
def getFavoritePlayerInfo(players):
    playerPositions = set()
    playerTeams = set()
    playerPoints = set()

    df = getPlayerSeasonStats()

    for player_id in players:
        matched = df[df["PLAYER_ID"] == player_id].iloc[0]
        additionalInfo = additionalPlayerInfo(player_id)
        playerData = playerJson(matched, player_id, additionalInfo)

        playerPositions.add(playerData["position"])
        playerTeams.add(playerData["team"])
        playerPoints.add(playerData["pts"].item())
    
    return [playerPositions, playerTeams, playerPoints]

# get all the information that I need from favorited teams
def getFavoriteTeamInfo(teams):
    sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    teamCities = set()
    teamStates = set()
    teamDivisions = set()
    teamConferences = set()

    for team_id in teams:
        team = sb.from_("nba_teams")\
            .select("city,state,division,conference")\
            .eq("id", team_id)\
            .execute()
        team = team.data[0]

        teamCities.add(team["city"])
        teamStates.add(team["state"])
        teamDivisions.add(team["division"])
        teamConferences.add(team["conference"])
    
    return [teamCities, teamStates, teamDivisions, teamConferences]

# getting the id for all users
def getUsers():
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    resp = sb.from_("profiles")\
        .select("id")\
        .execute()
    
    userIds = []
    for user in resp.data:
        userIds.append(user["id"])
    
    return userIds

def getInteractionCategory(ratio):
    if ratio > 1.25:
        return "high"
    elif ratio < 0.75:
        return "low"
    else:
        return "average"
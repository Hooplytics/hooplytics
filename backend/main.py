from stats import getPlayerSeasonStats, getFullTeamStats, additionalPlayerInfo
from modalHelpers import playerJson, teamJson, dataExtraction, fetchCache, upsert, queryGames
from predictionDataHelpers import fetchPredictionData, getMeansAndStdDevs, normalizeInput, getUserWeights, getInteractionAverages, getUserInteractions
from predictionModel import trainModel
from similarUserWeights import getSimilarUserWeights
from configuration import SUPABASE_URL, SUPABASE_ANON_KEY, TTL, FEATURE_ORDER
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date, timezone
from typing import List, Literal
from supabase import create_client
import numpy as np
import json

app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
async def startup():
    app.state.sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    app.state.normalizedData = fetchPredictionData(app.state.sb)
    _, app.state.means, app.state.stdDevs = getMeansAndStdDevs(app.state.sb)
    app.state.model = trainModel(app.state.normalizedData, k=25)

@app.on_event("shutdown")
async def shutdown():
    pass

# get player or team data to use for the graph
@app.get("/{entity_type}/{entity_id}/games", response_model=List[dict])
async def getGameData(entity_type: Literal["player", "team"], entity_id: int, startDate: date = Query(..., alias="startDate"), endDate: date = Query(..., alias="endDate")):
    sb = app.state.sb
    cutoff = datetime.now(timezone.utc) - TTL # used to determine if cached data is expired

    currEnd = endDate
    currStart = startDate

    # try fetch from cache
    row = await fetchCache(sb, entity_type, entity_id)
    if row:
        currStart = date.fromisoformat(row["start_date"])
        currEnd  = date.fromisoformat(row["end_date"])

    use_cache = ((row) and (datetime.fromisoformat(row["last_fetched"]) > cutoff) and (date.fromisoformat(row["start_date"]) <= startDate) and (date.fromisoformat(row["end_date"]) >= endDate))
    if use_cache:
        games = row["data"] # use cached data if not expired and requested time range exists in database
    else:
        games = await upsert(sb, entity_type, entity_id, startDate, endDate, currEnd, currStart) # fetch from API if cached data is expired or requested time range exceeds what is in database

    # get only the games with dates within the query
    return queryGames(games, startDate, endDate)

@app.get("/search/players") 
def getPlayers(player: str):
    try:
        players = getPlayerSeasonStats()
    except Exception as e:
        print(f'Error fetching player data: {e}')
        return []

    return dataExtraction("player", "PLAYER_NAME", player, players)

@app.get("/players/{player_id}")
def getPlayer(player_id: int):
    try:
        df = getPlayerSeasonStats()
    except Exception as e:
        print(f'Error fetching player data: {e}')
        return {}
    
    matched = df[df["PLAYER_ID"] == player_id].iloc[0]
    additionalInfo = additionalPlayerInfo(player_id)
    return playerJson(matched, player_id, additionalInfo)

@app.get("/search/teams")
def getTeams(team: str):
    try:
        teams = getFullTeamStats() 
    except Exception as e:
        print(f'Error fetching teams: {e}')
        return []

    return dataExtraction("team", "TEAM_NAME", team, teams)

@app.get("/teams/{team_id}")
def getTeam(team_id: int):
    try:
        df = getFullTeamStats() 
    except Exception as e:
        print(f'Error fetching teams: {e}')
        return
    
    matched = df[df["TEAM_ID"] == team_id].iloc[0]
    return teamJson(matched, team_id)

@app.get("/predict")
async def predict(request: Request, features: str = Query(..., description="JSON-encoded features dict")):
    try:
        featuresDict = json.loads(features)
    except json.JSONDecodeError:
        raise HTTPException(400, "features must be valid JSON")
    
    sb = app.state.sb
    jwt = request.headers.get("Authorization", "")
    if jwt:
        jwt = jwt.replace("Bearer ", "")
        sb.auth.set_session(access_token=jwt, refresh_token="") 
        user = sb.auth.get_user(jwt)
        user_id = str(user.dict().get("user", {}).get("id"))

        interactionAverages = getInteractionAverages() # getting the averages for all interaction types
        userInteractions = getUserInteractions(sb, interactionAverages, user_id) # getting the user's ratios for each interaction type compared to the average
        userWeights = getUserWeights(user_id, userInteractions) # getting the scaled user weight

        similarWeights = getSimilarUserWeights(user_id, interactionAverages) # getting the scaled weight based on similar users

        finalWeights = [a + b for a, b in zip(userWeights, similarWeights)] # final weight is combined of half of user weight and half of similar weight
    else:
        finalWeights = getUserWeights(None, None)

    normalizedInput = normalizeInput(featuresDict, app.state.means, app.state.stdDevs)
    orderedFeatures = []
    for key in FEATURE_ORDER:
        orderedFeatures.append(normalizedInput[key])
    x = np.asarray(orderedFeatures, dtype=float)
    y = app.state.model.predict(x, finalWeights)
    return y

@app.post("/interaction/{type}")
async def updateInteraction(type: str, request: Request):
    sb = app.state.sb
    jwt = request.headers.get("Authorization", "").replace("Bearer ", "")
    sb.auth.set_session(access_token=jwt, refresh_token="") 
    user = sb.auth.get_user(jwt)
    user_id = str(user.dict().get("user", {}).get("id"))

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized user")

    if type not in ["position", "date", "point"]:
        raise HTTPException(status_code=400, detail="Invalid interaction type")

    column_map = {
        "position": "position_count",
        "date": "date_count",
        "point": "point_count"
    }
    column_to_increment = column_map[type]

    resp = sb.from_("user_interactions")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="User interaction row not found")

    update_data = {column_to_increment: resp.data[0][column_to_increment] + 1}
    resp = sb.from_("user_interactions")\
        .update(update_data)\
        .eq("user_id", user_id)\
        .execute()

    return {"status": "ok", "updated": resp.data}
from stats import getPlayerSeasonStats, getFullTeamStats, additionalPlayerInfo
from modalHelpers import playerJson, teamJson, dataExtraction, fetchCache, upsert, queryGames
from predictionDataHelpers import fetchPredictionData, getMeansAndStdDevs, weighInput
from predictionModel import trainModel
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime, timedelta, date, timezone
from typing import List, Literal
from supabase import create_client
from dotenv import load_dotenv
import numpy as np

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

TTL = timedelta(hours=24)

@app.on_event("startup")
async def startup():
    app.state.sb = await create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    app.state.weighedData = await fetchPredictionData(app.state.sb)
    rawData, app.state.means, app.state.stdDevs = await getMeansAndStdDevs(app.state.sb)
    app.state.model = trainModel(app.state.weighedData, k=25)

@app.on_event("shutdown")
async def shutdown():
    pass

@app.get("/{entity_type}/{entity_id}/games", response_model=List[dict])
async def getGameData(entity_type: Literal["player", "team"], entity_id: int, startDate: date = Query(..., alias="startDate"), endDate: date = Query(..., alias="endDate")):
    sb = app.state.sb
    cutoff = datetime.now(timezone.utc) - TTL

    currEnd = endDate
    currStart = startDate

    # try fetch from cache
    row = await fetchCache(sb, entity_type, entity_id)
    if row:
        currStart = date.fromisoformat(row["start_date"])
        currEnd  = date.fromisoformat(row["end_date"])

    use_cache = ((row) and (datetime.fromisoformat(row["last_fetched"]) < cutoff) and (date.fromisoformat(row["start_date"]) <= startDate) and (date.fromisoformat(row["end_date"]) >= endDate))
    if use_cache:
        games = row["data"]
    else:
        games = await upsert(sb, entity_type, entity_id, startDate, endDate, currEnd, currStart)

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

@app.post("/predict")
async def predict(features: dict[str, float]):
    weighedInput = weighInput(features, app.state.means, app.state.stdDevs)
    x = np.asarray(weighedInput, dtype=float)
    return app.state.model.predict(x)
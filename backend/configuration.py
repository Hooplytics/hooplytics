import os
from dotenv import load_dotenv
from datetime import timedelta, date
from dateutil.relativedelta import relativedelta

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

TTL = timedelta(hours=24)
HARDCODED_ENDDATE = date(2025, 4, 14)
ONE_MONTH_BACK = relativedelta(weeks=4)

FEATURE_ORDER = [
    "home",
    "guard",
    "center",
    "forward",
    "restDays",
    "season_end",
    "last7GameAvg",
    "season_begin",
    "forward_guard",
    "guard_forward",
    "seasonAverage",
    "season_middle",
    "center_forward",
    "forward_center",
    "opponentPointsAllowed",
]

TEAM_ABBREVIATIONS = {
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

NORMALIZE_KEYS = [
    "seasonAverage", 
    "last7GameAvg", 
    "restDays", 
    "opponentPointsAllowed"
]

MULTIPLE_SIMILAR = 5 # multiple similar teams or players
ONE_SIMILAR = 4 # one similar team or player

# first value is for team heuristic, second value is for player heuristic
MULTIPLE_SIMILAR_PLAYER_TEAMS = (3, 1) 
ONE_SIMILAR_PLAYER_TEAM = (2, 0.5)

SAME_CITY = 1
SAME_STATE = 0.75
SAME_DIVISION = 0.5
SAME_CONFERENCE = 0.25

SIMILAR_PPG = 3
SIMILAR_POSITION = 2

SIMILAR_INTERACTION = (2, 3)
NEIGHBORING_INTERACTION = (1, 1.5)
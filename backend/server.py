from fastapi import FastAPI
import pandas as pd
import numpy as np
#from catboost import CatBoostRegressor
import requests
import os
from io import StringIO
from pydantic import BaseModel
from dotenv import load_dotenv

URL = "https://raw.githubusercontent.com/NguyenJimmyT/webscraperSenior/refs/heads/main/parking_data.csv"
app = FastAPI()
API_KEY = os.getenv("API_KEY")
load_dotenv()

class routing(BaseModel):
    lat: float
    long: float
    dest: str


@app.get("/currectTrends")
async def filter_csv():
    response = requests.get(URL)
    parse = pd.read_csv(StringIO(response.text))
    start = pd.Timestamp("2025-01-21 00:00:00")
    end_before = pd.Timestamp("2025-05-22 23:59:59")
    skip = pd.Timestamp("2025-08-01 00:00:00")
    skip_end = pd.Timestamp.now()

    parse["lastUpdated"] = parse["lastUpdated"].str.strip()

    parse["datetime"] = pd.to_datetime(parse["lastUpdated"], format="mixed")

    prev_sem = (parse["datetime"] >= start) & (parse["datetime"] <= end_before)
    current_sem = (parse["datetime"] >= skip) & (parse["datetime"] <= skip_end)

    filtered = parse[prev_sem | current_sem]

    filtered.to_csv("Spring&Fall2025.csv", index=False)
    return {"message": "filtered CSV created"}

@app.get("/catModel")
async def createModel():
    dataset = pd.read_csv("Spring&Fall2025.csv")
    
    dataset['structure'] = dataset['structure'].str.title()
    dataset['level'] = dataset['level'].str.title()

    dataset = dataset.rename(columns={'timeScape': 'time', 'lastUpdated': 'date'})
    dataset = dataset[dataset['structure'] != 'Fullerton Free Church']
    dataset['datetime'] = dataset['datetime'].dt.tz_convert('US/Pacific')
    dataset['time'] = dataset['date'].dt.strftime('%H:%M:%S')
    dataset = dataset[['structure', 'level', 'available', 'total', 'date', 'time']]
    dataset = dataset.drop_duplicates(subset=['date', 'level'])
    dataset['available'] = dataset['available'].replace('Full', 0)
    dataset['available'] = dataset['available'].astype(int)


    pass

@app.post("/estimate")    
async def estimate_route(req: routing):
    location = {"Nutwood": (33.87923900540178, -117.88855798831945), "StateCollege": (33.883140284399985, -117.88861163250014),
                     "EastsideNorth": (33.881009299648376, -117.88180150382846), "EastsideSouth": (33.880301186357116, -117.88175590627496),
                     "Stadium": (33.88814961697887, -117.88741292165311)}
    
    api_req = (
        f"https://api.tomtom.com/routing/1/calculateRoute/"
        f"{req.lat},{req.long}:{location[req.dest][0]},{location[req.dest][1]}/json"
        f"?traffic=true&travelMode=car&key={API_KEY}"
    )

    response = requests.get(api_req)

    if response.status_code != 200:
        return {"error": response.text}

    data = response.json()
    result = data["routes"][0]["summary"]
    total_sec = result["travelTimeInSeconds"]
    hrs = total_sec // 3600
    mins = (total_sec % 3600) // 60
    secs = total_sec % 60

    return {
        "distance": result["lengthInMeters"]*0.0006213712,
        "travel_time_hr": hrs,
        "travel_time_minutes": mins,
        "travel_time_sec": secs,
        "route": data
    }


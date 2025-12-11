from fastapi import FastAPI
import pandas as pd
import numpy as np
import requests
import os
import json
import pytz
import math
from io import StringIO
from datetime import datetime, timedelta
from catboost import CatBoostRegressor
from pydantic import BaseModel
from dotenv import load_dotenv

URL = "https://raw.githubusercontent.com/NguyenJimmyT/TitanRush/refs/heads/main/backend/forecast.json"
app = FastAPI()
API_KEY = os.getenv("API_KEY")
load_dotenv()

class routing(BaseModel):
    lat: float
    long: float
    dest: str

@app.post("/estimate")    
async def estimate_route(req: routing):
    location = {"Nutwood": (33.87923900540178, -117.88855798831945), "StateCollege": (33.883140284399985, -117.88861163250014),
                "EastsideNorth": (33.881009299648376, -117.88180150382846), "EastsideSouth": (33.880301186357116, -117.88175590627496),
                "LotA&G": (33.88814961697887, -117.88741292165311)}
    
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

    response = requests.get(URL)
    parkingEstimate = json.loads(response.text)

    max_avail = {"Nutwood": 2484, "StateCollege": 1373, "EastsideNorth": 1880, "EastsideSouth": 1341, "LotA&G": 2104}
    time_parking = {"Nutwood": 20, "StateCollege": 18, "EastsideNorth": 20, "EastsideSouth": 18, "LotA&G": 14}
    search_struc = {"Nutwood": "Nutwood Structure", "StateCollege": "State College Structure", "EastsideNorth": "Eastside North", "EastsideSouth": "Eastside South", "LotA&G": "LotA&G"}
    
    curr_pst = datetime.now(pytz.timezone('US/Pacific'))
    curr_pst += timedelta(minutes=mins)
    temp_time = curr_pst.hour * 60 + curr_pst.minute
    roundfive = round(temp_time / 5) * 5
    curr_pst = curr_pst.replace(hour=roundfive//60, minute=roundfive%60, second=0, microsecond=0)
    curr_time = curr_pst.strftime('%H:%M:%S')
    curr_date = curr_pst.strftime('%Y-%m-%d')

    pred_avail = parkingEstimate[curr_date][curr_time][search_struc[req.dest]]
    spots_taken = max_avail[req.dest] - pred_avail
    percentage = spots_taken / max_avail[req.dest]
    estimate_time = math.ceil(time_parking[req.dest] * percentage)

    return {
        "total_time_parking": estimate_time,
        "distance": result["lengthInMeters"]*0.0006213712,
        "travel_time_hr": hrs,
        "travel_time_minutes": mins,
        "travel_time_sec": secs,
        "route": data
    }
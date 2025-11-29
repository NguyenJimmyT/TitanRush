from fastapi import FastAPI
import pandas as pd
import requests
import os
from io import StringIO
from pydantic import BaseModel
from dotenv import load_dotenv

URL = "https://raw.githubusercontent.com/NguyenJimmyT/webscraperSenior/refs/heads/main/parking_data.csv"
app = FastAPI()
API_KEY = os.getenv("API_KEY")

class routing(BaseModel):
    lat: float
    long: float
    dest: str


@app.get("/currectTrends")
async def filter_csv():
    response = requests(URL)
    parse = pd.read_csv(StringIO(response.text))
    start = pd.Timestamp("2025-01-21 10:10:00")
    end_before = pd.Timestamp("2025-05-22 19:18:00")
    skip = pd.Timestamp("2025-08-01 10:10:00")
    skip_end = pd.Timestamp.now()

    first_filter = (parse["datetime"] >= start) & (parse["datetime"] <= end_before)
    second_filter = (parse["datetime"] >= skip) & (parse["datetime"] <= skip_end)

    filtered = parse[first_filter | second_filter]

    filtered.to_csv("Spring&Fall2025.csv", index=False)

@app.get("/estimate")    
async def estimate_route(req: routing):
    location = {"Nutwood": (33.87923900540178, -117.88855798831945), "StateCollege": (33.883140284399985, -117.88861163250014),
                     "EastsideNorth": (33.881009299648376, -117.88180150382846), "EastsideSouth": (33.880301186357116, -117.88175590627496),
                     "Stadium": (33.88814961697887, -117.88741292165311)}
    
    api_req = (
        f"https://api.tomtom.com/routing/1/calculateRoute/"
        f"{req.lat},{req.long}:{location[req.dest][0]},{location[req.dest][1]}/json"
        f"?traffic=true&travelMode=pedestrian&key={API_KEY}"
    )

    response = requests.get(api_req)

    if response.status_code != 200:
        return {"error": response.text}

    data = response.json()
    result = data["routes"][0]["summary"]

    return {
        "distance": result["lengthInMeters"]*0.0006213712,
        "travel_time_hr": result["travelTimeInSeconds"] / 3600,
        "travel_time_minutes": (result["travelTimeInSeconds"] % 3600) / 60,
        "travel_time_sec": (result["travelTimeInSeconds"] % 3600) % 60,
        "route": data
    }
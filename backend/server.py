from fastapi import FastAPI
import pandas as pd
import numpy as np
import requests
import os
import json
from io import StringIO
from datetime import datetime, timedelta
from catboost import CatBoostRegressor
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

    dataset = dataset.rename(columns={'timeScrape': 'time', 'datetime': 'date'})
    dataset = dataset[dataset['structure'] != 'Fullerton Free Church']
    dataset['date'] = pd.to_datetime(dataset['date'], errors="coerce")
    dataset['date'] = dataset['date'].dt.tz_localize('US/Pacific')
    dataset['time'] = dataset['date'].dt.strftime('%H:%M:%S')
    dataset = dataset.drop_duplicates(subset=['date', 'level'])
    dataset['available'] = dataset['available'].replace('Full', 0).astype(int)
    semester_start = pd.Timestamp("2025-08-23", tz="US/Pacific")
    dataset['day_of_week'] = dataset['date'].dt.day_name()
    dataset['days_since_start'] = (dataset['date'] - semester_start).dt.days
    dataset['semester_week'] = (dataset['days_since_start'] // 7) + 1
    dataset['hour'] = dataset['date'].dt.hour
    dataset['minute'] = dataset['date'].dt.minute
    dataset['half_hour'] = dataset['hour'] + (dataset['minute'] >= 30) * 0.5
    dataset['total'] = dataset['total'].replace(120, 220)
    dataset['current_struc_avail'] = dataset.groupby(['structure', 'date', 'time'])['available'].transform('sum')
    dataset['total_struc_avail'] = dataset.groupby(['structure', 'date', 'time'])['total'].transform('sum')
    dataset = dataset.sort_values(by=['date', 'time', 'level']).reset_index(drop=True)
    dataset['percentage_full'] = (dataset['total_struc_avail'] - dataset['current_struc_avail']) / dataset['total_struc_avail']

    cat_feat = ['structure', 'day_of_week']
    num_feats = ['semester_week', 'half_hour']
    feat_cols = cat_feat + num_feats

    model = CatBoostRegressor(
        depth=6,
        learning_rate=0.05,
        iterations=400,
        loss_function="RMSE",
        random_seed=42,
        verbose=False
    )
    
    X_train = dataset[feat_cols]
    y_train = dataset['current_struc_avail']
    
    model.fit(X_train, y_train, cat_features=[0, 1])

    structure = dataset['structure'].unique()
    today = pd.Timestamp.now().date()

    this_week = today - timedelta(days=today.weekday() + 1)
    forecast_day = [this_week + timedelta(days=i) for i in range(14)]

    overall_forecast = {}
    for day in forecast_day:
        curr = pd.Timestamp(day).tz_localize('US/Pacific')
        dow = curr.day_name()
        sweek = ((curr - semester_start).days // 7) + 1 
        time = pd.date_range("00:00", "23:55", freq="5min").time
        rows = []
        for i in time:
            hh = i.hour + (i.minute >= 30) * 0.5
            for s in structure:
                rows.append({
                    "structure": s,
                    "day_of_week": dow,
                    "semester_week": sweek,
                    "half_hour": hh,
                    "time": i.strftime("%H:%M:%S")
                })
        pred = pd.DataFrame(rows)
        pred["avail"] = model.predict(pred[feat_cols]).round().astype(int)
        pivot = pred.pivot(index="time", columns="structure", values="avail")
        
        overall_forecast[str(day)] = pivot.to_dict(orient="index")
    with open("forecast.json", "w") as f:
        json.dump(overall_forecast, f, indent=4)
    return {"message": "forecast CSV created"}

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

    return {
        "distance": result["lengthInMeters"]*0.0006213712,
        "travel_time_hr": hrs,
        "travel_time_minutes": mins,
        "travel_time_sec": secs,
        "route": data
    }


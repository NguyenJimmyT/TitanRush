from fastapi import FastAPI, HTTPException
import requests
import os
import json
import pytz
import math
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List, Dict, Tuple
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY")
app = FastAPI()
URL = "https://raw.githubusercontent.com/NguyenJimmyT/TitanRush/refs/heads/main/backend/forecast.json"

class Routing(BaseModel):
    lat: float
    long: float
    dest: str

class WalkRouteRequest(BaseModel):
    parking_name: str
    building_name: str

class Coordinate(BaseModel):
    latitude: float
    longitude: float

class WalkRouteResponse(BaseModel):
    building_name: str
    route: List[Coordinate]
    total_distance_m: float
    total_distance_miles: float
    walk_time_hours: int
    walk_time_minutes: int
    walk_time_seconds: int

Parking = {
    "Nutwood": (33.87923900540178, -117.88855798831945),
    "StateCollege": (33.883140284399985, -117.88861163250014),
    "EastsideNorth": (33.881009299648376, -117.88180150382846),
    "EastsideSouth": (33.880301186357116, -117.88175590627496),
    "LotA&G": (33.88814961697887, -117.88741292165311)
}

Building = {
    "mcCarthy Hall": (33.87974392708859, -117.8855260605863),
    "pollak": (33.881166644510735, -117.88539520428624),
    "titanSU": (33.88175810600744, -117.8877595864612),
    "kinesiology": (33.88306146650037, -117.88577832706564),
    "ecs": (33.8823456148896, -117.88298838451502),
    "education": (33.881368615680856, -117.88441575588514),
    "business": (33.87913926662061, -117.88383283771155),
    "langsdorf": (33.87905814651741, -117.88452391198288),
    "danBlack": (33.879214372479666, -117.8858830476396),
    "mihaylo": (33.87867892581867, -117.88332910237824),
    "humanities": (33.88047756951303, -117.88448997892881),
    "gordon": (33.879716073467556, -117.8842721419777)
}

from .campus_nodes import NODE_ARRAY

NODE_COORDS: Dict[str, Tuple[float, float]] = {node_id: (lat, lon) for node_id, lat, lon in NODE_ARRAY}

import heapq

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def build_graph(k_neighbors=4):
    graph = {node: [] for node in NODE_COORDS}
    items = list(NODE_COORDS.items())
    for id1, (lat1, lon1) in items:
        distances = []
        for id2, (lat2, lon2) in items:
            if id1 != id2:
                distances.append((haversine_distance(lat1, lon1, lat2, lon2), id2))
        distances.sort()
        for d, neighbor in distances[:k_neighbors]:
            graph[id1].append((neighbor, d))
    return graph

GRAPH = build_graph()

def heuristic(n1, n2):
    lat1, lon1 = NODE_COORDS[n1]
    lat2, lon2 = NODE_COORDS[n2]
    return haversine_distance(lat1, lon1, lat2, lon2)

def find_closest_node(lat, lon):
    return min(NODE_COORDS.keys(), key=lambda n: haversine_distance(lat, lon, *NODE_COORDS[n]))

def reconstruct_path(came_from, curr):
    path = [curr]
    while curr in came_from:
        curr = came_from[curr]
        path.append(curr)
    return list(reversed(path))

def astar(start, goal):
    open_set = [(heuristic(start, goal), start)]
    came_from = {}
    g = {start: 0}
    closed = set()
    while open_set:
        _, current = heapq.heappop(open_set)
        if current == goal:
            return reconstruct_path(came_from, current)
        if current in closed:
            continue
        closed.add(current)
        for neighbor, cost in GRAPH[current]:
            tg = g[current] + cost
            if tg < g.get(neighbor, float("inf")):
                came_from[neighbor] = current
                g[neighbor] = tg
                heapq.heappush(open_set, (tg + heuristic(neighbor, goal), neighbor))
    return None

def compute_distance_and_time(points):
    if len(points) < 2:
        return 0, 0, 0, 0, 0
    total_m = sum(haversine_distance(
        points[i]["latitude"], points[i]["longitude"],
        points[i+1]["latitude"], points[i+1]["longitude"]
    ) for i in range(len(points) - 1))
    miles = total_m * 0.000621371
    hours_float = miles / 3
    total_sec = int(hours_float * 3600)
    return total_m, miles, total_sec // 3600, (total_sec % 3600) // 60, total_sec % 60

@app.post("/estimate")
async def estimate_route(req: Routing):
    location = {
        "Nutwood": (33.87923900540178, -117.88855798831945),
        "StateCollege": (33.883140284399985, -117.88861163250014),
        "EastsideNorth": (33.881009299648376, -117.88180150382846),
        "EastsideSouth": (33.880301186357116, -117.88175590627496),
        "LotA&G": (33.88814961697887, -117.88741292165311)
    }
    api_req = f"https://api.tomtom.com/routing/1/calculateRoute/{req.lat},{req.long}:{location[req.dest][0]},{location[req.dest][1]}/json?traffic=true&travelMode=car&key={API_KEY}"
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
        "distance": result["lengthInMeters"] * 0.0006213712,
        "travel_time_hr": hrs,
        "travel_time_minutes": mins,
        "travel_time_sec": secs,
        "route": data
    }

@app.post("/walk-route", response_model=WalkRouteResponse)
async def walk_route(req: WalkRouteRequest):
    if req.parking_name not in Parking:
        raise HTTPException(status_code=400, detail="Invalid parking name.")
    if req.building_name not in Building:
        raise HTTPException(status_code=400, detail="Invalid building name.")
    start_lat, start_lon = Parking[req.parking_name]
    dest_lat, dest_lon = Building[req.building_name]
    start_node = find_closest_node(start_lat, start_lon)
    dest_node = find_closest_node(dest_lat, dest_lon)
    node_path = astar(start_node, dest_node)
    if not node_path:
        pts = [{"latitude": start_lat, "longitude": start_lon}, {"latitude": dest_lat, "longitude": dest_lon}]
    else:
        pts = [{"latitude": start_lat, "longitude": start_lon}]
        for node in node_path:
            lat, lon = NODE_COORDS[node]
            pts.append({"latitude": lat, "longitude": lon})
        pts.append({"latitude": dest_lat, "longitude": dest_lon})
    total_m, total_miles, h, m, s = compute_distance_and_time(pts)
    return {
        "building_name": req.building_name,
        "route": pts,
        "total_distance_m": total_m,
        "total_distance_miles": total_miles,
        "walk_time_hours": h,
        "walk_time_minutes": m,
        "walk_time_seconds": s
    }

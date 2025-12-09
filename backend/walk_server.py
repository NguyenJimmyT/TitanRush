# walk_server.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Tuple, Optional
import math
import heapq

from campus_nodes import NODE_ARRAY  # [["A01", lat, lon], ...]


app = FastAPI()


# ---- Request / Response Models ----

class WalkRouteRequest(BaseModel):
    building_name: str        # e.g. "McCarthy Hall"
    start_lat: float          # parking structure lat
    start_lon: float          # parking structure lon
    dest_lat: float           # building lat
    dest_lon: float           # building lon


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


# ====== GRAPH + A* IMPLEMENTATION ======

# NODE_ARRAY is: [["A01", 33.87..., -117.88...], ...]
# Build a lookup: node_id -> (lat, lon)
NODE_COORDS: Dict[str, Tuple[float, float]] = {
    node_id: (lat, lon) for node_id, lat, lon in NODE_ARRAY
}


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Returns distance in meters between two lat/lon points using the haversine formula.
    """
    R = 6371000.0  # Earth radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def build_graph(k_neighbors: int = 4) -> Dict[str, List[Tuple[str, float]]]:
    """
    Build a graph where each node connects to its k nearest neighbors.
    Graph format:
      {
        "A01": [("A02", distance_in_meters), ("A03", ...), ...],
        ...
      }
    """
    graph: Dict[str, List[Tuple[str, float]]] = {node_id: [] for node_id in NODE_COORDS.keys()}
    node_items = list(NODE_COORDS.items())  # [(id, (lat, lon)), ...]

    for i, (id1, (lat1, lon1)) in enumerate(node_items):
        distances: List[Tuple[float, str]] = []
        for j, (id2, (lat2, lon2)) in enumerate(node_items):
            if id1 == id2:
                continue
            d = haversine_distance(lat1, lon1, lat2, lon2)
            distances.append((d, id2))

        distances.sort(key=lambda x: x[0])
        for d, neighbor_id in distances[:k_neighbors]:
            graph[id1].append((neighbor_id, d))

    return graph


GRAPH = build_graph(k_neighbors=4)


def heuristic(node_id: str, goal_id: str) -> float:
    """Heuristic for A*: straight-line distance between node and goal."""
    lat1, lon1 = NODE_COORDS[node_id]
    lat2, lon2 = NODE_COORDS[goal_id]
    return haversine_distance(lat1, lon1, lat2, lon2)


def find_closest_node(lat: float, lon: float) -> Optional[str]:
    """
    Return the ID of the closest campus node to the given lat/lon.
    """
    best_id: Optional[str] = None
    best_dist: float = float("inf")

    for node_id, (nlat, nlon) in NODE_COORDS.items():
        d = haversine_distance(lat, lon, nlat, nlon)
        if d < best_dist:
            best_dist = d
            best_id = node_id

    return best_id


def reconstruct_path(came_from: Dict[str, str], current: str) -> List[str]:
    """
    Reconstruct path of node IDs from A* search.
    """
    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    path.reverse()
    return path


def astar(start_id: str, goal_id: str) -> Optional[List[str]]:
    """
    A* pathfinding over the campus node graph.
    Returns a list of node IDs from start_id to goal_id, or None if no path.
    """
    if start_id not in GRAPH or goal_id not in GRAPH:
        return None

    open_heap: List[Tuple[float, str]] = []
    heapq.heappush(open_heap, (heuristic(start_id, goal_id), start_id))

    came_from: Dict[str, str] = {}
    g_score: Dict[str, float] = {start_id: 0.0}

    closed_set = set()

    while open_heap:
        _, current = heapq.heappop(open_heap)

        if current == goal_id:
            return reconstruct_path(came_from, current)

        if current in closed_set:
            continue
        closed_set.add(current)

        for neighbor_id, edge_cost in GRAPH.get(current, []):
            tentative_g = g_score[current] + edge_cost

            if tentative_g < g_score.get(neighbor_id, float("inf")):
                came_from[neighbor_id] = current
                g_score[neighbor_id] = tentative_g
                f_score = tentative_g + heuristic(neighbor_id, goal_id)
                heapq.heappush(open_heap, (f_score, neighbor_id))

    return None


def compute_distance_and_time(route_points: List[Dict[str, float]]) -> Tuple[float, float, int, int, int]:
    """
    Given a list of points [{latitude, longitude}, ...],
    compute:
      - total distance in meters and miles
      - walking time at 3 mph as (hours, minutes, seconds)
    """
    if len(route_points) < 2:
        return 0.0, 0.0, 0, 0, 0

    total_m = 0.0
    for i in range(len(route_points) - 1):
        p1 = route_points[i]
        p2 = route_points[i + 1]
        total_m += haversine_distance(
            p1["latitude"], p1["longitude"],
            p2["latitude"], p2["longitude"]
        )

    # meters -> miles
    total_miles = total_m * 0.000621371

    # Walking speed: 3 mph
    if total_miles <= 0:
        return total_m, total_miles, 0, 0, 0

    hours_float = total_miles / 3.0  # time in hours
    total_seconds = int(round(hours_float * 3600))

    h = total_seconds // 3600
    m = (total_seconds % 3600) // 60
    s = total_seconds % 60

    return total_m, total_miles, h, m, s


# ---- Endpoint using A* ----

@app.post("/walk-route", response_model=WalkRouteResponse)
async def walk_route(req: WalkRouteRequest):
    """
    Compute a walking route from a parking structure (start_lat/lon)
    to a campus building (dest_lat/lon) using A* on campus graph.

    Returns:
      - full route polyline
      - total distance (m + miles)
      - walking time at 3 mph (h/m/s)
    """

    start_node = find_closest_node(req.start_lat, req.start_lon)
    dest_node = find_closest_node(req.dest_lat, req.dest_lon)

    # Fallback: if snapping to graph fails, use a straight line
    if start_node is None or dest_node is None or start_node == dest_node:
        route_points = [
            {"latitude": req.start_lat, "longitude": req.start_lon},
            {"latitude": req.dest_lat, "longitude": req.dest_lon},
        ]
        total_m, total_miles, h, m, s = compute_distance_and_time(route_points)

        return {
            "building_name": req.building_name,
            "route": route_points,
            "total_distance_m": total_m,
            "total_distance_miles": total_miles,
            "walk_time_hours": h,
            "walk_time_minutes": m,
            "walk_time_seconds": s,
        }

    node_path = astar(start_node, dest_node)

    # Fallback if A* fails (disconnected graph, etc.)
    if not node_path:
        route_points = [
            {"latitude": req.start_lat, "longitude": req.start_lon},
            {"latitude": req.dest_lat, "longitude": req.dest_lon},
        ]
        total_m, total_miles, h, m, s = compute_distance_and_time(route_points)

        return {
            "building_name": req.building_name,
            "route": route_points,
            "total_distance_m": total_m,
            "total_distance_miles": total_miles,
            "walk_time_hours": h,
            "walk_time_minutes": m,
            "walk_time_seconds": s,
        }

    # Build final polyline: start → nodes → dest
    route_points: List[Dict[str, float]] = []
    route_points.append({"latitude": req.start_lat, "longitude": req.start_lon})

    for node_id in node_path:
        lat, lon = NODE_COORDS[node_id]
        route_points.append({"latitude": lat, "longitude": lon})

    route_points.append({"latitude": req.dest_lat, "longitude": req.dest_lon})

    total_m, total_miles, h, m, s = compute_distance_and_time(route_points)

    return {
        "building_name": req.building_name,
        "route": route_points,
        "total_distance_m": total_m,
        "total_distance_miles": total_miles,
        "walk_time_hours": h,
        "walk_time_minutes": m,
        "walk_time_seconds": s,
    }

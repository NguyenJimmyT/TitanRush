from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

# ---- Existing root route ----
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend!"}

# ---- New models for request/response ----
class EstimateRequest(BaseModel):
    user_lat: float
    user_lng: float
    class_building_id: int
    arrival_time: datetime

class EstimateResponse(BaseModel):
    total_minutes: float
    drive_minutes: float
    parking_search_minutes: float
    walk_minutes: float
    chosen_lot_id: int

# ---- Simple dummy implementation ----
@app.post("/estimate", response_model=EstimateResponse)
def get_estimate(req: EstimateRequest):
    # For now, just hard-code some values
    drive = 20.0
    parking_search = 10.0
    walk = 8.0

    return EstimateResponse(
        total_minutes=drive + parking_search + walk,
        drive_minutes=drive,
        parking_search_minutes=parking_search,
        walk_minutes=walk,
        chosen_lot_id=1
    )

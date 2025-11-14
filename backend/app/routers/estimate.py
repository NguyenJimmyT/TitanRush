from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import SessionLocal

router = APIRouter(prefix="/estimate", tags=["estimate"])

class EstimateRequest(BaseModel):
    user_lat: float
    user_lng: float
    class_building_id: int
    arrival_time: str  # ISO string

class EstimateResponse(BaseModel):
    total_minutes: float
    drive_minutes: float
    parking_search_minutes: float
    walk_minutes: float
    chosen_lot_id: int

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=EstimateResponse)
def get_estimate(req: EstimateRequest, db: Session = Depends(get_db)):
    # TODO: query building + parking lot and compute real values
    drive = 20.0
    parking_search = 10.0
    walk = 8.0

    return EstimateResponse(
        total_minutes=drive + parking_search + walk,
        drive_minutes=drive,
        parking_search_minutes=parking_search,
        walk_minutes=walk,
        chosen_lot_id=1,
    )

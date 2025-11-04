from fastapi import FastAPI
import pandas as pd
import requests
from io import StringIO

URL = "https://raw.githubusercontent.com/NguyenJimmyT/webscraperSenior/refs/heads/main/parking_data.csv"
app = FastAPI()

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

    
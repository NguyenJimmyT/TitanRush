import pandas as pd
import requests
import json
from io import StringIO
from datetime import datetime, timedelta
from catboost import CatBoostRegressor

URL_SCRAPE = "https://raw.githubusercontent.com/NguyenJimmyT/webscraperSenior/refs/heads/main/parking_data.csv"
URL_FILTER = "https://raw.githubusercontent.com/NguyenJimmyT/TitanRush/refs/heads/main/backend/Spring%26Fall2025.csv"

def filter_csv():
    response = requests.get(URL_SCRAPE)
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

def createModel():
    response = requests.get(URL_FILTER)
    dataset = pd.read_csv(StringIO(response.text))
    
    dataset['structure'] = dataset['structure'].str.title()
    dataset['level'] = dataset['level'].str.title()
    dataset['structure'] = dataset['structure'].replace({"Lot A & G": "LotA&G", "S8 And S10": "LotA&G"})
    dataset = dataset.rename(columns={'timeScrape': 'time', 'datetime': 'date'})
    dataset = dataset[dataset['structure'] != 'Fullerton Free Church']
    dataset['date'] = pd.to_datetime(dataset['date'], errors="coerce")
    dataset['date'] = dataset['date'].dt.tz_localize('US/Pacific')
    dataset['time'] = dataset['date'].dt.strftime('%H:%M:%S')
    dataset = dataset.drop_duplicates(subset=['date', 'level'])
    dataset['gap'] = dataset['date'].diff().dt.days
    dataset['sem_count'] = (dataset['gap'] > 30).cumsum()
    dataset['sem_start'] = dataset.groupby('sem_count')['date'].transform('min').dt.normalize()
    dataset['week_sem'] = ((dataset['date'] - dataset['sem_start']).dt.days // 7 + 1)
    dataset['available'] = dataset['available'].replace('Full', 0).astype(int)
    dataset['day_of_week'] = dataset['date'].dt.day_name()
    dataset['hour'] = dataset['date'].dt.hour
    dataset['minute'] = dataset['date'].dt.minute
    dataset['half_hour'] = dataset['hour'] + (dataset['minute'] >= 30) * 0.5
    dataset['current_struc_avail'] = dataset.groupby(['structure', 'date', 'time'])['available'].transform('sum')
    dataset['total_struc_avail'] = dataset.groupby(['structure', 'date', 'time'])['total'].transform('sum')
    dataset = dataset.sort_values(by=['date', 'time', 'level']).reset_index(drop=True)
    dataset['percentage_full'] = (dataset['total_struc_avail'] - dataset['current_struc_avail']) / dataset['total_struc_avail']
    dataset['month'] = dataset['date'].dt.month
    dataset['avg_hh'] = (dataset.groupby(['structure', 'half_hour'])['current_struc_avail']).transform('mean')
    dataset['week_sem'] = dataset['week_sem'].astype(str)
    cat_feat = ['structure', 'day_of_week', 'month', 'week_sem']
    num_feats = ['half_hour', 'avg_hh']
    feat_cols = cat_feat + num_feats

    model = CatBoostRegressor(
        depth=10,
        learning_rate=0.02,
        iterations=2000,
        loss_function="RMSE",
        l2_leaf_reg=5,
        random_seed=42,
        verbose=False
    )
    
    X_train = dataset[feat_cols]
    y_train = dataset['current_struc_avail']
    
    model.fit(X_train, y_train, cat_features=[0, 1, 2, 3])

    structure = dataset['structure'].unique()
    today = pd.Timestamp.now().date()

    this_week = today - timedelta(days=today.weekday() + 1)
    forecast_day = [this_week + timedelta(days=i) for i in range(14)]

    overall_forecast = {}
    for day in forecast_day:
        curr = pd.Timestamp(day).tz_localize('US/Pacific')
        dow = curr.day_name()
        time = pd.date_range("00:00", "23:55", freq="5min").time
        avg_hh = dataset.groupby(['structure', 'half_hour'])['avg_hh'].mean()
        sem_start = dataset.groupby('sem_count')['sem_start'].max().max()
        week_sem = str(max(1, ((curr.normalize() - sem_start).days // 7 + 1)))
        rows = []
        for i in time:
            hh = i.hour + (i.minute >= 30) * 0.5
            for s in structure:
                rows.append({
                    "structure": s,
                    "day_of_week": dow,
                    "month": curr.month,
                    "week_sem": week_sem,
                    "half_hour": hh,
                    "time": i.strftime("%H:%M:%S"),
                    "avg_hh": float(avg_hh.get((s, hh), 0))
                })
        pred = pd.DataFrame(rows)
        pred["avail"] = model.predict(pred[feat_cols]).round().astype(int)
        pivot = pred.pivot(index="time", columns="structure", values="avail")
        
        overall_forecast[str(day)] = pivot.to_dict(orient="index")
    with open("forecast.json", "w") as f:
        json.dump(overall_forecast, f, indent=4)
    return {"message": "forecast CSV created"}

if __name__ == "__main__":
    print(createModel())
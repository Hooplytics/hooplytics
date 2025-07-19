import numpy as np
import pandas as pd
from collections import Counter
import os
from dotenv import load_dotenv
from supabase import create_client

# using Manhattan Distance because we want outliers to have less of an effect
def manhattanDistance(x1, x2):
    return np.sum(np.abs(x1 - x2))

class KNN:
    def __init__(self, k=3):
        self.k = k

    def fit(self, X, y):
        self.X_train = np.array(X, dtype=float)
        self.y_train = np.array(y, dtype=int)

    def predict(self, x):
        x = np.asarray(x, dtype=float)
        # this speeds up the process rather than using loops
        distances = np.sum(np.abs(self.X_train - x), axis=1) # distances from point to all training data
        kIndex = np.argpartition(distances, self.k)[:self.k] # gets k smallest without caring about order
        return round(float(np.mean(self.y_train[kIndex]))) # average target values of k closest

def trainModel(data, k):
    df = pd.DataFrame(data)

    # turning features into a 2D array
    features = df["features"].iloc[0][0].keys()
    flat_feats = [
        [ game[feature] for feature in features ]
        for player in df["features"]
        for game in player
    ]
    features = np.array(flat_feats, dtype=float)
    targets = np.array([points for player in df["targets"] for points in player])

    model = KNN(k=k)
    model.fit(features, targets)
    return model

# * Uncomment this to test the model
# def main():
#     load_dotenv()
#     SUPABASE_URL    = os.getenv("SUPABASE_URL")
#     SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

#     sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
#     resp = sb.from_("weighted_data")\
#         .select("features, targets")\
#         .execute()
#     df = pd.DataFrame(resp.data)

#     # turning features into a 2D array
#     features = df["features"].iloc[0][0].keys()
#     flat_feats = [
#         [ game[feature] for feature in features ]
#         for player in df["features"]
#         for game in player
#     ]
#     features = np.array(flat_feats, dtype=float)
#     targets = np.array([points for player in df["targets"] for points in player])
#     i = 1400 # using the actual features data as examples for input data
#     model = trainModel(resp.data, k=25)
#     y = model.predict(features[i])
#     print(f'Predicted value: {y}, Actual value: {targets[i]}') # keep this to test predicted values vs actual values

# if __name__ == "__main__":
#     main()
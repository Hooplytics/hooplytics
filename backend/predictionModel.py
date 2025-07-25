from configuration import SUPABASE_URL, SUPABASE_ANON_KEY
import numpy as np
import pandas as pd
from supabase import create_client

class KNN:
    def __init__(self, k=3):
        self.k = k

    def fit(self, X, y):
        self.X_train = np.array(X, dtype=float)
        self.y_train = np.array(y, dtype=int)

    def predict(self, x, weights):
        x = np.asarray(x, dtype=float)
        featureWeights = np.array(weights, dtype=float)
        # this speeds up the process rather than using loops
        weightedDiff = np.abs(self.X_train - x) * (featureWeights)
        distances = np.sum(weightedDiff, axis=1) # distances from point to all training data (using manhattan distance to try to drown out outliers)
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
#     sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
#     resp = sb.from_("normalized_data")\
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
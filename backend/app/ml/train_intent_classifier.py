from pathlib import Path
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib


def main():
    root = Path(__file__).resolve().parents[2]  # -> backend/
    data_path = root / "data" / "intent_dataset.csv"
    models_dir = Path(__file__).resolve().parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_path)

    X = df["text"].astype(str)
    y = df["intent"].astype(str)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=20000)),
        ("clf", LogisticRegression(max_iter=1000))
    ])

    pipeline.fit(X, y)

    out_path = models_dir / "intent_classifier.joblib"
    joblib.dump(pipeline, out_path)
    print(f"[intent_classifier] Saved model to {out_path}")


if __name__ == "__main__":
    main()

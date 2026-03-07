import sys, json
import joblib
import pandas as pd
import numpy as np

MODEL_PATH = "backend/models/career_model.joblib"
ENCODERS_PATH = "backend/models/career_label_encoders.joblib"
TARGET_PATH = "backend/models/career_target_encoder.joblib"

model = joblib.load(MODEL_PATH)
label_encoders = joblib.load(ENCODERS_PATH)
target_encoder = joblib.load(TARGET_PATH)

raw = sys.stdin.read()
inp = json.loads(raw)

df = pd.DataFrame([inp])

def safe_transform(le, value: str) -> int:
    """
    Transform a single categorical value with LabelEncoder.
    If unseen, map to "Unknown" if present, otherwise map to the first class (fallback).
    """
    value = str(value)

    classes = le.classes_
    # Ensure numpy array
    if not isinstance(classes, np.ndarray):
        classes = np.array(classes, dtype=str)
        le.classes_ = classes

    # If value exists, transform normally
    if value in classes:
        return int(le.transform([value])[0])

    # Try Unknown
    if "Unknown" in classes:
        return int(le.transform(["Unknown"])[0])

    # If Unknown not present, fallback to first class (safe fallback)
    return 0

# Encode categorical columns
for col, le in label_encoders.items():
    if col in df.columns:
        df[col] = df[col].astype(str)
        df[col] = df[col].apply(lambda v: safe_transform(le, v))

# Predict class
pred_idx = int(model.predict(df)[0])
career = target_encoder.inverse_transform([pred_idx])[0]

# Confidence (if supported)
confidence = None
try:
    proba = model.predict_proba(df)[0]
    confidence = float(np.max(proba))
except:
    confidence = None

out = {"career": career}
if confidence is not None:
    out["confidence"] = round(confidence * 100, 1)

print(json.dumps(out))
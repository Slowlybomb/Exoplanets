from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import json
import numpy as np
from pathlib import Path

app = Flask(__name__)
CORS(app)

MODEL_PATH = Path(__file__).with_name("model_test_1.joblib")
SAMPLE_PATH = Path(__file__).with_name("test_data.json")

# Columns that leak the target label and should never reach the model
LEAKAGE_KEYS = {
    "kepler_name",
    "kepoi_name",
    "koi_teq_err1",
    "kepid",
    "koi_disposition",
    "koi_pdisposition",
    "koi_fpflag_nt",
    "koi_fpflag_ss",
    "koi_fpflag_co",
    "koi_fpflag_ec",
    "koi_tce_delivname",
    "koi_teq_err2",
    "koi_kepmag",
    "koi_srad",
    "koi_score"
}

FEATURE_KEYS = [
    "koi_period",
    "koi_period_err1",
    "koi_period_err2",
    "koi_time0bk",
    "koi_time0bk_err1",
    "koi_time0bk_err2",
    "koi_impact",
    "koi_impact_err1",
    "koi_impact_err2",
    "koi_duration",
    "koi_duration_err1",
    "koi_duration_err2",
    "koi_depth",
    "koi_depth_err1",
    "koi_depth_err2",
    "koi_prad",
    "koi_prad_err1",
    "koi_prad_err2",
    "koi_teq",
    "koi_insol",
    "koi_insol_err1",
    "koi_insol_err2",
    "koi_model_snr",
    "koi_tce_plnt_num",
    "koi_steff",
    "koi_steff_err1",
    "koi_steff_err2",
    "koi_slogg",
    "koi_slogg_err1",
    "koi_slogg_err2",
    "koi_srad_err1",
    "koi_srad_err2",
    "ra"
]

model = joblib.load(MODEL_PATH)


def load_sample() -> dict:
    with SAMPLE_PATH.open("r", encoding="utf-8") as f:
        sample = json.load(f)

    return {key: value for key, value in sample.items() if key not in LEAKAGE_KEYS}


def prepare_payload(payload: dict) -> tuple[np.ndarray, dict]:
    missing = [key for key in FEATURE_KEYS if key not in payload]
    if missing:
        raise ValueError(f"Missing features: {', '.join(missing)}")

    prepared_features: dict[str, float] = {}
    for key in FEATURE_KEYS:
        try:
            prepared_features[key] = float(payload[key])
        except (ValueError, TypeError):
            raise ValueError("All feature values must be numeric.")

    vector = [prepared_features[key] for key in FEATURE_KEYS]
    return np.array([vector]), prepared_features


@app.route("/")
def mainpage():
    return render_template("index.html")


@app.route("/exoplanet", methods=["GET", "POST"])
def exoplanet():
    if request.method == "GET":
        sample = load_sample()
        features_vector, prepared = prepare_payload(sample)
        prediction = int(model.predict(features_vector)[0])
        return jsonify({"prediction": prediction, "features": prepared})

    payload = request.get_json(silent=True) or {}
    try:
        features_vector, prepared = prepare_payload(payload)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    prediction = int(model.predict(features_vector)[0])
    return jsonify({"prediction": prediction, "features": prepared})


if __name__ == "__main__":
    app.run(debug=True)

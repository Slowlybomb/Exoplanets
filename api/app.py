import csv
import io
import json
import math
from pathlib import Path

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

try:  # Optional dependency from backend_api branch
    import joblib  # type: ignore
except Exception:  # pragma: no cover
    joblib = None

try:  # Optional dependency from backend_api branch
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover
    np = None

app = Flask(__name__)
CORS(app)

SAMPLE_PATH = Path(__file__).with_name("test_data.json")
MODEL_PARAMS_PATH = Path(__file__).with_name("lightweight_model.json")
JOBLIB_MODEL_PATH = Path(__file__).with_name("model.joblib")

_JOBLIB_MODEL = None

ENGINE_LIGHTWEIGHT = "lightweight"
ENGINE_JOBLIB = "joblib"
SUPPORTED_ENGINES = {ENGINE_LIGHTWEIGHT, ENGINE_JOBLIB}

if not MODEL_PARAMS_PATH.exists():
    raise RuntimeError(
        "lightweight_model.json is missing. Run backend/train_lightweight_model.py to generate it."
    )

MODEL_PARAMS = json.loads(MODEL_PARAMS_PATH.read_text(encoding="utf-8"))

FEATURE_KEYS = MODEL_PARAMS["feature_keys"]
WEIGHTS = MODEL_PARAMS["weights"]
BIAS = float(MODEL_PARAMS["bias"])
MEANS = [float(MODEL_PARAMS["means"][key]) for key in FEATURE_KEYS]
STDS = [float(MODEL_PARAMS["stds"][key]) or 1.0 for key in FEATURE_KEYS]
MEDIANS = [float(MODEL_PARAMS["medians"][key]) for key in FEATURE_KEYS]


def load_sample() -> dict:
    with SAMPLE_PATH.open("r", encoding="utf-8") as f:
        sample = json.load(f)

    return {key: value for key, value in sample.items() if key in FEATURE_KEYS}


def get_joblib_model():
    global _JOBLIB_MODEL
    if joblib is None:
        return None
    if _JOBLIB_MODEL is None and JOBLIB_MODEL_PATH.exists():
        try:
            _JOBLIB_MODEL = joblib.load(JOBLIB_MODEL_PATH)
        except Exception:  # pragma: no cover - cache best effort
            _JOBLIB_MODEL = None
    return _JOBLIB_MODEL


def prepare_payload(payload: dict) -> dict[str, float]:
    missing = [key for key in FEATURE_KEYS if key not in payload]
    if missing:
        raise ValueError(f"Missing features: {', '.join(missing)}")

    prepared_features: dict[str, float] = {}
    for key in FEATURE_KEYS:
        try:
            value = float(payload[key])
        except (ValueError, TypeError):
            raise ValueError("All feature values must be numeric.")
        if not math.isfinite(value):
            raise ValueError("Feature values must be finite numbers.")
        prepared_features[key] = value

    return prepared_features


def sigmoid(value: float) -> float:
    if value >= 0:
        exp_term = math.exp(-value)
        return 1.0 / (1.0 + exp_term)
    exp_term = math.exp(value)
    return exp_term / (1.0 + exp_term)


def predict_probability(features: dict[str, float]) -> float:
    total = BIAS
    for weight, key, mean, std, median in zip(WEIGHTS, FEATURE_KEYS, MEANS, STDS, MEDIANS):
        raw = features.get(key, median)
        scaled = (raw - mean) / std
        total += weight * scaled
    return sigmoid(total)


def build_lightweight_prediction(prepared_features: dict[str, float]) -> dict[str, object]:
    probability = predict_probability(prepared_features)
    return {
        "prediction": int(probability >= 0.5),
        "probability": probability,
        "features": prepared_features,
        "engine": ENGINE_LIGHTWEIGHT,
    }


def build_joblib_prediction(prepared_features: dict[str, float], model) -> dict[str, object]:
    if np is not None:
        feature_vector = np.array([[prepared_features[key] for key in FEATURE_KEYS]], dtype=float)
    else:
        feature_vector = [[prepared_features[key] for key in FEATURE_KEYS]]

    raw_prediction = model.predict(feature_vector)[0]
    try:
        prediction_value = int(raw_prediction)
    except (TypeError, ValueError):
        prediction_value = int(bool(raw_prediction))

    probability_value: float | None = None
    if hasattr(model, "predict_proba"):
        try:
            proba = model.predict_proba(feature_vector)[0]
            if len(proba) > 1:
                probability_value = float(proba[1])
            else:
                probability_value = float(proba[0])
        except Exception:  # pragma: no cover - downstream model may not support proba
            probability_value = None

    result: dict[str, object] = {
        "prediction": prediction_value,
        "features": prepared_features,
        "engine": ENGINE_JOBLIB,
    }
    if probability_value is not None and math.isfinite(probability_value):
        result["probability"] = probability_value
    return result


def run_inference(prepared_features: dict[str, float], engine: str) -> dict[str, object]:
    if engine == ENGINE_JOBLIB:
        model = get_joblib_model()
        if model is None:
            raise ValueError("Joblib model is not available on the server.")
        return build_joblib_prediction(prepared_features, model)
    return build_lightweight_prediction(prepared_features)


def classify_batch(payloads: list[dict], engine: str) -> list[dict[str, object]]:
    results: list[dict[str, object]] = []
    for index, payload in enumerate(payloads):
        if not isinstance(payload, dict):
            results.append({"index": index, "error": "Each record must be a JSON object."})
            continue

        try:
            prepared = prepare_payload(payload)
        except ValueError as exc:
            results.append({"index": index, "error": str(exc)})
            continue

        try:
            prediction = run_inference(prepared, engine)
        except ValueError as exc:
            results.append({"index": index, "error": str(exc)})
            continue

        results.append({"index": index, **prediction})

    return results


def load_batch_from_file(file_storage) -> list[dict]:
    filename = (file_storage.filename or "").lower()
    mimetype = (file_storage.mimetype or "").lower()

    try:
        raw_bytes = file_storage.read()
    except Exception as exc:  # pragma: no cover - defensive guard
        raise ValueError("Failed to read the uploaded file.") from exc

    if not raw_bytes:
        raise ValueError("Uploaded file is empty.")

    def is_json() -> bool:
        return filename.endswith(".json") or "json" in mimetype

    def is_csv() -> bool:
        return filename.endswith(".csv") or "csv" in mimetype

    if is_json():
        try:
            decoded = raw_bytes.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise ValueError("JSON file must be UTF-8 encoded.") from exc

        try:
            data = json.loads(decoded)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Could not parse JSON file: {exc.msg}.") from exc

        if isinstance(data, dict):
            return [data]
        if isinstance(data, list):
            return data
        raise ValueError("JSON file must contain an object or a list of objects.")

    if is_csv():
        try:
            text_stream = io.StringIO(raw_bytes.decode("utf-8-sig"))
        except UnicodeDecodeError as exc:
            raise ValueError("CSV file must be UTF-8 encoded.") from exc

        reader = csv.DictReader(text_stream)
        if reader.fieldnames is None:
            raise ValueError("CSV file must include a header row.")

        rows = [row for row in reader if row and any((value or "").strip() for value in row.values())]
        if not rows:
            raise ValueError("CSV file does not contain any data rows.")
        return rows

    raise ValueError("Unsupported file type. Upload a .json or .csv file.")


def choose_engine(raw_engine: str | None) -> str:
    engine = (raw_engine or "").strip().lower()
    if not engine:
        return ENGINE_LIGHTWEIGHT
    if engine not in SUPPORTED_ENGINES:
        raise ValueError(
            f"Unsupported engine '{raw_engine}'. Valid options are: {', '.join(sorted(SUPPORTED_ENGINES))}."
        )
    if engine == ENGINE_JOBLIB and get_joblib_model() is None:
        raise ValueError("Joblib model requested but it is not available on the server.")
    return engine


@app.route("/")
def mainpage():
    return render_template("index.html")


@app.route("/exoplanet", methods=["GET", "POST"])
def exoplanet():
    engine_param = request.args.get("engine")
    try:
        engine = choose_engine(engine_param)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if request.method == "GET":
        sample = load_sample()
        prepared = prepare_payload(sample)
        try:
            prediction = run_inference(prepared, engine)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        return jsonify(prediction)

    uploaded_file = request.files.get("file")
    if uploaded_file:
        try:
            batch_payloads = load_batch_from_file(uploaded_file)
            results = classify_batch(batch_payloads, engine)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        return jsonify({"results": results, "engine": engine})

    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "Request must include JSON data or an uploaded file."}), 400

    if isinstance(payload, list):
        results = classify_batch(payload, engine)
        return jsonify({"results": results, "engine": engine})

    if not isinstance(payload, dict):
        return jsonify({"error": "JSON payload must be an object or an array of objects."}), 400

    try:
        prepared = prepare_payload(payload)
        prediction = run_inference(prepared, engine)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(prediction)


if __name__ == "__main__":
    app.run(debug=True)

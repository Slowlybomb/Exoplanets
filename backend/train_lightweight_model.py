"""Train a leakage-free logistic regression model for KOI classification.

This script relies only on the Python standard library so it can run in
restricted environments. It reads the cumulative KOI catalogue bundled with
this project, trains a logistic regression model using gradient descent, and
serialises the resulting parameters to ``lightweight_model.json``. The model
uses only the features exposed by the detector UI and applies median
imputation plus z-score normalisation prior to classification.
"""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path
from typing import Dict, Iterable, List

DATASET_PATH = Path(__file__).resolve().parent.parent / "dataset" / "cumulative_2025.10.04_06.46.42.csv"
OUTPUT_PATH = Path(__file__).with_name("lightweight_model.json")

FEATURE_KEYS: List[str] = [
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
    "ra",
]

LabelVector = List[float]
FeatureMatrix = List[List[float]]


def _load_rows() -> Iterable[Dict[str, str]]:
    with DATASET_PATH.open(encoding="utf-8") as source:
        reader = csv.DictReader(line for line in source if not line.startswith("#"))
        for row in reader:
            yield row


def _parse_dataset() -> tuple[FeatureMatrix, LabelVector]:
    feature_samples: FeatureMatrix = []
    labels: LabelVector = []

    # Collect values per feature to compute medians for imputation later.
    raw_values: Dict[str, List[float]] = {key: [] for key in FEATURE_KEYS}

    for row in _load_rows():
        disposition = row.get("koi_disposition", "").strip().upper()
        if disposition not in {"CONFIRMED", "FALSE POSITIVE"}:
            continue

        label = 1.0 if disposition == "CONFIRMED" else 0.0
        labels.append(label)

        sample: List[float | None] = []
        for key in FEATURE_KEYS:
            value = row.get(key)
            if value is None or value.strip() == "" or value.strip().lower() == "nan":
                sample.append(None)
                continue
            try:
                numeric = float(value)
            except ValueError:
                sample.append(None)
                continue
            sample.append(numeric)
            raw_values[key].append(numeric)

        feature_samples.append(sample)  # type: ignore[arg-type]

    medians = {
        key: _median(values) if values else 0.0 for key, values in raw_values.items()
    }

    # Impute missing values and compute mean / std for normalisation.
    means = {key: 0.0 for key in FEATURE_KEYS}
    for sample in feature_samples:
        for index, key in enumerate(FEATURE_KEYS):
            value = medians[key] if sample[index] is None else float(sample[index])
            sample[index] = value
            means[key] += value

    count = len(feature_samples)
    means = {key: total / count for key, total in means.items()}

    stds = {key: 0.0 for key in FEATURE_KEYS}
    for sample in feature_samples:
        for index, key in enumerate(FEATURE_KEYS):
            diff = float(sample[index]) - means[key]
            stds[key] += diff * diff

    stds = {
        key: math.sqrt(value / max(count - 1, 1)) if value else 1.0
        for key, value in stds.items()
    }

    # Standardise the dataset in-place.
    for sample in feature_samples:
        for index, key in enumerate(FEATURE_KEYS):
            sample[index] = (float(sample[index]) - means[key]) / stds[key]

    weights, bias = _train_logistic_regression(feature_samples, labels)

    payload = {
        "feature_keys": FEATURE_KEYS,
        "medians": medians,
        "means": means,
        "stds": stds,
        "weights": weights,
        "bias": bias,
    }
    OUTPUT_PATH.write_text(json.dumps(payload), encoding="utf-8")
    print(f"Saved model to {OUTPUT_PATH}")


def _median(values: List[float]) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    mid = len(sorted_values) // 2
    if len(sorted_values) % 2 == 0:
        return (sorted_values[mid - 1] + sorted_values[mid]) / 2.0
    return sorted_values[mid]


def _sigmoid(value: float) -> float:
    if value >= 0:
        exp_term = math.exp(-value)
        return 1.0 / (1.0 + exp_term)
    exp_term = math.exp(value)
    return exp_term / (1.0 + exp_term)


def _train_logistic_regression(
    features: FeatureMatrix,
    labels: LabelVector,
    *,
    learning_rate: float = 0.05,
    epochs: int = 50,
) -> tuple[List[float], float]:
    count = len(features)
    n_features = len(FEATURE_KEYS)
    weights = [0.0] * n_features
    bias = 0.0

    for _ in range(epochs):
        grad_w = [0.0] * n_features
        grad_b = 0.0

        for sample, label in zip(features, labels):
            activation = bias
            for w, x in zip(weights, sample):
                activation += w * x
            prediction = _sigmoid(activation)
            error = prediction - label

            for index, value in enumerate(sample):
                grad_w[index] += error * value
            grad_b += error

        rate = learning_rate / count
        weights = [w - rate * g for w, g in zip(weights, grad_w)]
        bias -= rate * grad_b

    return weights, bias


if __name__ == "__main__":
    _parse_dataset()

"""Extract classifier feature columns from the NASA dataset.

This helper trims the raw archive dump down to the exact feature keys used by the
lightweight model so batch predictions receive consistently shaped inputs.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = REPO_ROOT / "backend" / "lightweight_model.json"
RAW_DATASET_PATH = REPO_ROOT / "dataset" / "cumulative_2025.10.04_06.46.42.csv"
OUTPUT_PATH = RAW_DATASET_PATH.with_name("classifier_features.csv")

FEATURE_KEYS: list[str] = []


def load_feature_keys() -> list[str]:
    params = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
    return list(params.get("feature_keys", []))


def iter_dataset_rows(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        data_lines = (line for line in handle if not line.startswith("#"))
        reader = csv.DictReader(data_lines)
        if reader.fieldnames is None:
            raise RuntimeError("Dataset does not include a CSV header row.")
        missing = [key for key in FEATURE_KEYS if key not in reader.fieldnames]
        if missing:
            raise RuntimeError(
                "Dataset is missing required feature columns: " + ", ".join(missing)
            )
        for row in reader:
            yield row


def write_feature_dataset(rows_iter) -> int:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FEATURE_KEYS)
        writer.writeheader()
        count = 0
        for row in rows_iter:
            trimmed = {key: row.get(key, "") for key in FEATURE_KEYS}
            writer.writerow(trimmed)
            count += 1
    return count


if __name__ == "__main__":
    FEATURE_KEYS = load_feature_keys()
    row_iterator = iter_dataset_rows(RAW_DATASET_PATH)
    total_rows = write_feature_dataset(row_iterator)
    print(f"Wrote {total_rows} rows to {OUTPUT_PATH.relative_to(REPO_ROOT)}")

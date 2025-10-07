"""Extract classifier feature columns from the NASA dataset.

This helper trims the raw archive dump down to the exact feature keys used by the
lightweight model so batch predictions receive consistently shaped inputs.
"""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path

try:
    import matplotlib.pyplot as plt
except Exception:  # pragma: no cover - plotting is optional
    plt = None


REPO_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = REPO_ROOT / "backend" / "lightweight_model.json"
RAW_DATASET_PATH = REPO_ROOT / "dataset" / "cumulative_2025.10.04_06.46.42.csv"
OUTPUT_PATH = RAW_DATASET_PATH.with_name("classifier_features.csv")

FEATURE_KEYS: list[str] = []
PLOT_FEATURES = [
    "koi_period",
    "koi_prad",
    "koi_teq",
    "koi_insol",
    "koi_model_snr",
]


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


def write_feature_dataset(rows_iter) -> tuple[int, dict[str, list[float]]]:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    numeric_samples: dict[str, list[float]] = {key: [] for key in PLOT_FEATURES}
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FEATURE_KEYS)
        writer.writeheader()
        count = 0
        for row in rows_iter:
            trimmed = {key: row.get(key, "") for key in FEATURE_KEYS}
            writer.writerow(trimmed)
            count += 1
            for feature in PLOT_FEATURES:
                value = trimmed.get(feature, "")
                if value in ("", None):
                    continue
                try:
                    numeric_value = float(value)
                except (TypeError, ValueError):
                    continue
                if math.isfinite(numeric_value):
                    numeric_samples[feature].append(numeric_value)
    return count, numeric_samples


def generate_plots(numeric_samples: dict[str, list[float]], *, bins: int = 40) -> None:
    if plt is None:
        print("matplotlib not available; rendering ASCII histograms instead.")
        for feature, values in numeric_samples.items():
            if not values:
                continue
            minimum = min(values)
            maximum = max(values)
            if not math.isfinite(minimum) or not math.isfinite(maximum):
                continue
            print(f"\n{feature} distribution ({len(values)} samples)")
            if minimum == maximum:
                print(f"  All values identical: {minimum}")
                continue
            bucket_count = max(10, min(50, bins))
            bucket_width = (maximum - minimum) / bucket_count
            buckets = [0] * bucket_count
            for value in values:
                index = int((value - minimum) / bucket_width)
                if index == bucket_count:
                    index -= 1
                buckets[index] += 1
            peak = max(buckets)
            scale = 40 / peak if peak > 0 else 0
            for idx, count in enumerate(buckets):
                bar = "#" * max(1, int(count * scale)) if count else ""
                start = minimum + idx * bucket_width
                end = start + bucket_width
                print(f"  {start:>10.3f} – {end:>10.3f}: {bar} ({count})")
        return

    plots_dir = OUTPUT_PATH.parent / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)

    for feature, values in numeric_samples.items():
        if not values:
            continue
        plt.figure(figsize=(7, 4))
        plt.hist(values, bins=bins, color="#4c8ed9", edgecolor="#1f2633")
        plt.title(f"Distribution of {feature}")
        plt.xlabel(feature)
        plt.ylabel("Count")
        plt.tight_layout()
        output_file = plots_dir / f"{feature}_hist.png"
        plt.savefig(output_file, dpi=150)
        plt.close()
        print(f"Saved histogram for {feature} -> {output_file.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    FEATURE_KEYS = load_feature_keys()
    row_iterator = iter_dataset_rows(RAW_DATASET_PATH)
    total_rows, samples = write_feature_dataset(row_iterator)
    print(f"Wrote {total_rows} rows to {OUTPUT_PATH.relative_to(REPO_ROOT)}")
    generate_plots(samples)

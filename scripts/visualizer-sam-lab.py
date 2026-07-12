#!/usr/bin/env python3
"""Run the local SAM2 export against the starter pool benchmark.

This is a lab tool, not a build dependency. It mirrors the browser worker's
1024 square preprocessing, encodes once, then compares one-point and
multi-point face prompts against the owner-corrected shell fixture.
"""

from __future__ import annotations

import argparse
import base64
import json
from pathlib import Path
from typing import Iterable
import zlib

import cv2
import numpy as np
import onnxruntime as ort


ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "tests/fixtures/visualizer/starter-pool.json"
MODELS = ROOT / "public/models/sam2"
SIDE = 1024
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
FACE_ORDER = ("back", "left", "right", "floor")


def centroid(points: Iterable[dict[str, float]]) -> tuple[float, float]:
    values = list(points)
    return (
        sum(point["x"] for point in values) / len(values),
        sum(point["y"] for point in values) / len(values),
    )


def outside_prompt(face: str, quad: list[dict[str, float]], centre: tuple[float, float]) -> tuple[float, float]:
    first, second = (quad[2], quad[3]) if face == "floor" else (quad[0], quad[1])
    edge = ((first["x"] + second["x"]) / 2, (first["y"] + second["y"]) / 2)
    return (
        float(np.clip(edge[0] * 2 - centre[0], 0.01, 0.99)),
        float(np.clip(edge[1] * 2 - centre[1], 0.01, 0.99)),
    )


def shell_faces(shell: dict) -> dict[str, list[dict[str, float]]]:
    rim = shell["rim"]
    floor = shell["floor"]
    rtl, rtr, rbr, rbl = rim
    ftl, ftr, fbr, fbl = floor
    return {
        "back": [rtl, rtr, ftr, ftl],
        "left": [rbl, rtl, ftl, fbl],
        "right": [rtr, rbr, fbr, ftr],
        "floor": [ftl, ftr, fbr, fbl],
    }


def polygon_mask(points: list[dict[str, float]], width: int, height: int) -> np.ndarray:
    polygon = np.array(
        [[round(point["x"] * (width - 1)), round(point["y"] * (height - 1))] for point in points],
        dtype=np.int32,
    )
    mask = np.zeros((height, width), dtype=np.uint8)
    cv2.fillConvexPoly(mask, polygon, 1)
    return mask


def largest_component(mask: np.ndarray) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    if count <= 1:
        return mask.astype(np.uint8)
    label = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    return (labels == label).astype(np.uint8)


def iou(a: np.ndarray, b: np.ndarray) -> float:
    intersection = np.logical_and(a, b).sum()
    union = np.logical_or(a, b).sum()
    return float(intersection / union) if union else 0.0


def encode_rle(mask: np.ndarray) -> list[int]:
    """COCO-style alternating zero and one counts in row-major order."""
    counts: list[int] = []
    value = 0
    run = 0
    for pixel in mask.reshape(-1):
        bit = int(pixel != 0)
        if bit == value:
            run += 1
        else:
            counts.append(run)
            run = 1
            value = bit
    counts.append(run)
    return counts


def envelope(mask: np.ndarray, side: str) -> np.ndarray:
    points: list[tuple[float, float]] = []
    height, width = mask.shape
    if side in ("top", "bottom"):
        for x in range(width):
            ys = np.flatnonzero(mask[:, x])
            if ys.size:
                y = ys[0] if side == "top" else ys[-1]
                points.append((x, int(y)))
    else:
        for y in range(height):
            xs = np.flatnonzero(mask[y])
            if xs.size:
                x = xs[0] if side == "left" else xs[-1]
                points.append((int(x), y))
    return np.asarray(points, dtype=np.float64)


def contact_boundary(first: np.ndarray, second: np.ndarray, radius: int = 5) -> np.ndarray:
    kernel = np.ones((3, 3), dtype=np.uint8)
    first_edge = first.astype(np.uint8) - cv2.erode(first.astype(np.uint8), kernel)
    second_edge = second.astype(np.uint8) - cv2.erode(second.astype(np.uint8), kernel)
    reach_kernel = np.ones((radius * 2 + 1, radius * 2 + 1), dtype=np.uint8)
    near_second = cv2.dilate(second_edge, reach_kernel)
    near_first = cv2.dilate(first_edge, reach_kernel)
    joined = np.logical_or(first_edge & near_second, second_edge & near_first)
    y, x = np.nonzero(joined)
    return np.column_stack([x, y]).astype(np.float64)


def robust_line(points: np.ndarray, tolerance: float = 2.5) -> np.ndarray:
    if len(points) < 8:
        raise ValueError("not-enough-line-points")
    rng = np.random.default_rng(7)
    best: np.ndarray | None = None
    best_count = -1
    best_error = float("inf")
    for _ in range(min(1600, len(points) * 8)):
        first, second = rng.choice(len(points), 2, replace=False)
        a = points[first]
        b = points[second]
        direction = b - a
        length = np.linalg.norm(direction)
        if length < 8:
            continue
        normal = np.array([direction[1], -direction[0]]) / length
        distance = np.abs((points - a) @ normal)
        inliers = distance <= tolerance
        count = int(inliers.sum())
        error = float(distance[inliers].mean()) if count else float("inf")
        if count > best_count or (count == best_count and error < best_error):
            best = inliers
            best_count = count
            best_error = error
    if best is None or best_count < 8:
        raise ValueError("line-not-found")
    vx, vy, x0, y0 = cv2.fitLine(
        points[best].astype(np.float32),
        cv2.DIST_L2,
        0,
        0.01,
        0.01,
    ).reshape(-1)
    normal = np.array([vy, -vx], dtype=np.float64)
    normal /= np.linalg.norm(normal)
    return np.array([normal[0], normal[1], -(normal[0] * x0 + normal[1] * y0)])


def line_intersection(first: np.ndarray, second: np.ndarray) -> np.ndarray:
    matrix = np.array([[first[0], first[1]], [second[0], second[1]]])
    determinant = np.linalg.det(matrix)
    if abs(determinant) < 1e-8:
        raise ValueError("parallel-lines")
    return np.linalg.solve(matrix, np.array([-first[2], -second[2]]))


def line_endpoint(points: np.ndarray, line: np.ndarray, use_min_x: bool) -> np.ndarray:
    direction = np.array([-line[1], line[0]])
    origin = -line[2] * line[:2]
    distance = (points - origin) @ direction
    low, high = np.quantile(distance, [0.01, 0.99])
    ends = [origin + low * direction, origin + high * direction]
    return min(ends, key=lambda point: point[0]) if use_min_x else max(ends, key=lambda point: point[0])


def average_points(first: np.ndarray, second: np.ndarray) -> np.ndarray:
    return (first + second) / 2


def solve_shell(masks: dict[str, np.ndarray]) -> dict[str, list[dict[str, float]]]:
    back_top_points = envelope(masks["back"], "top")
    left_top_points = envelope(masks["left"], "top")
    right_top_points = envelope(masks["right"], "top")
    floor_bottom_points = envelope(masks["floor"], "bottom")
    left_near_points = envelope(masks["left"], "left")
    right_near_points = envelope(masks["right"], "right")

    back_top = robust_line(back_top_points)
    left_top = robust_line(left_top_points)
    right_top = robust_line(right_top_points)
    back_floor = robust_line(contact_boundary(masks["back"], masks["floor"]))
    left_floor = robust_line(contact_boundary(masks["left"], masks["floor"]))
    right_floor = robust_line(contact_boundary(masks["right"], masks["floor"]))
    left_near = robust_line(left_near_points)
    right_near = robust_line(right_near_points)
    near_floor = robust_line(floor_bottom_points)

    rim = [
        average_points(
            line_endpoint(back_top_points, back_top, True),
            line_endpoint(left_top_points, left_top, False),
        ),
        average_points(
            line_endpoint(back_top_points, back_top, False),
            line_endpoint(right_top_points, right_top, True),
        ),
        line_endpoint(right_top_points, right_top, False),
        line_endpoint(left_top_points, left_top, True),
    ]
    floor = [
        line_intersection(back_floor, left_floor),
        line_intersection(back_floor, right_floor),
        line_intersection(near_floor, right_near),
        line_intersection(near_floor, left_near),
    ]
    height, width = masks["floor"].shape

    def normalize(point: np.ndarray) -> dict[str, float]:
        return {
            "x": float(np.clip(point[0] / width, 0.02, 0.98)),
            "y": float(np.clip(point[1] / height, 0.02, 0.98)),
        }

    return {
        "rim": [normalize(point) for point in rim],
        "floor": [normalize(point) for point in floor],
    }


def draw_shell(image: np.ndarray, shell: dict) -> np.ndarray:
    out = image.copy()
    height, width = out.shape[:2]
    groups = [shell["rim"], shell["floor"]]

    def pixel(point: dict[str, float]) -> tuple[int, int]:
        return round(point["x"] * width), round(point["y"] * height)

    for points in groups:
        polygon = np.array([pixel(point) for point in points], dtype=np.int32)
        cv2.polylines(out, [polygon], True, (40, 220, 255), 2, cv2.LINE_AA)
    for rim_point, floor_point in zip(shell["rim"], shell["floor"]):
        cv2.line(out, pixel(rim_point), pixel(floor_point), (40, 220, 255), 2, cv2.LINE_AA)
    for point in [*shell["rim"], *shell["floor"]]:
        cv2.circle(out, pixel(point), 5, (15, 20, 25), -1, cv2.LINE_AA)
        cv2.circle(out, pixel(point), 4, (120, 205, 245), -1, cv2.LINE_AA)
    return out


def corner_report(shell: dict, gold: dict, width: int, height: int) -> dict[str, float | list[float]]:
    predicted = [*shell["rim"], *shell["floor"]]
    expected = [*gold["rim"], *gold["floor"]]
    diagonal = float(np.hypot(width, height))
    errors = [
        float(
            np.hypot(
                (point["x"] - target["x"]) * width,
                (point["y"] - target["y"]) * height,
            ) / diagonal
        )
        for point, target in zip(predicted, expected)
    ]
    return {
        "errors": errors,
        "mean": float(np.mean(errors)),
        "max": float(np.max(errors)),
    }


def preprocess(image: np.ndarray) -> np.ndarray:
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (SIDE, SIDE), interpolation=cv2.INTER_LINEAR)
    values = resized.astype(np.float32) / 255.0
    values = (values - MEAN) / STD
    return values.transpose(2, 0, 1)[None]


def sessions() -> tuple[ort.InferenceSession, ort.InferenceSession]:
    providers = ["CPUExecutionProvider"]
    encoder = ort.InferenceSession(
        str(MODELS / "vision_encoder_fp16.onnx"),
        providers=providers,
    )
    decoder = ort.InferenceSession(
        str(MODELS / "prompt_encoder_mask_decoder_fp16.onnx"),
        providers=providers,
    )
    return encoder, decoder


def decode(
    decoder: ort.InferenceSession,
    embeddings: dict[str, np.ndarray],
    points: list[tuple[float, float]],
    labels: list[int],
    width: int,
    height: int,
) -> tuple[np.ndarray, list[float], int]:
    feeds = dict(embeddings)
    feeds["input_points"] = np.array(
        [[[[x * SIDE, y * SIDE] for x, y in points]]],
        dtype=np.float32,
    )
    feeds["input_labels"] = np.array([[labels]], dtype=np.int64)
    feeds["input_boxes"] = np.empty((1, 0, 4), dtype=np.float32)
    scores, masks, _ = decoder.run(None, feeds)
    values = scores.reshape(-1)
    best = int(np.argmax(values))
    logits = masks.reshape(-1, masks.shape[-2], masks.shape[-1])[best]
    resized = cv2.resize(logits, (width, height), interpolation=cv2.INTER_LINEAR)
    return largest_component(resized > 0), [float(value) for value in values], best


def tint(image: np.ndarray, mask: np.ndarray, color: tuple[int, int, int]) -> np.ndarray:
    out = image.copy()
    coat = np.full_like(out, color)
    alpha = (mask.astype(np.float32) * 0.48)[..., None]
    return np.round(out * (1 - alpha) + coat * alpha).astype(np.uint8)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("/private/tmp/au-mosaic-visualizer-lab"),
    )
    parser.add_argument("--long-edge", type=int, default=480)
    parser.add_argument("--fixture-out", type=Path)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    fixture = json.loads(FIXTURE.read_text())
    image = cv2.imread(str(ROOT / fixture["image"]["path"]))
    if image is None:
        raise SystemExit("starter image missing")
    scale = min(1.0, args.long_edge / max(image.shape[:2]))
    width = max(1, round(image.shape[1] * scale))
    height = max(1, round(image.shape[0] * scale))
    preview = cv2.resize(image, (width, height), interpolation=cv2.INTER_AREA)

    gold_faces = shell_faces(fixture["gold"])
    seed_faces = shell_faces(fixture["productionBaseline"])
    seeds = {face: centroid(seed_faces[face]) for face in FACE_ORDER}
    gold_masks = {
        face: polygon_mask(gold_faces[face], width, height)
        for face in FACE_ORDER
    }

    encoder, decoder = sessions()
    encoded = encoder.run(None, {"pixel_values": preprocess(image)})
    embeddings = {
        output.name: value
        for output, value in zip(encoder.get_outputs(), encoded)
    }

    report: dict[str, dict] = {}
    selected_masks: dict[str, np.ndarray] = {}
    colors = {
        "back": (190, 115, 60),
        "left": (70, 170, 225),
        "right": (90, 205, 110),
        "floor": (205, 95, 190),
    }
    overlay = preview.copy()
    for face in FACE_ORDER:
        positive = seeds[face]
        one_mask, one_scores, one_best = decode(
            decoder,
            embeddings,
            [positive],
            [1],
            width,
            height,
        )
        negatives = [seeds[name] for name in FACE_ORDER if name != face]
        coping_or_deck = outside_prompt(face, seed_faces[face], positive)
        multi_mask, multi_scores, multi_best = decode(
            decoder,
            embeddings,
            [positive, *negatives, coping_or_deck],
            [1, *([0] * (len(negatives) + 1))],
            width,
            height,
        )
        one_iou = iou(one_mask, gold_masks[face])
        multi_iou = iou(multi_mask, gold_masks[face])
        selected_masks[face] = multi_mask
        overlay = tint(overlay, multi_mask, colors[face])
        cv2.imwrite(str(args.out / f"{face}-one.png"), one_mask * 255)
        cv2.imwrite(str(args.out / f"{face}-multi.png"), multi_mask * 255)
        cv2.imwrite(str(args.out / f"{face}-gold.png"), gold_masks[face] * 255)
        report[face] = {
            "seed": {"x": positive[0], "y": positive[1]},
            "onePoint": {"iou": one_iou, "scores": one_scores, "best": one_best},
            "multiPoint": {"iou": multi_iou, "scores": multi_scores, "best": multi_best},
        }

    cv2.imwrite(str(args.out / "overlay.jpg"), overlay)
    candidate_shell = solve_shell(selected_masks)
    report["jointShell"] = {
        "shell": candidate_shell,
        "cornerError": corner_report(candidate_shell, fixture["gold"], width, height),
    }
    cv2.imwrite(str(args.out / "joint-shell.jpg"), draw_shell(overlay, candidate_shell))
    (args.out / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    if args.fixture_out:
        fixture_out = args.fixture_out
        if not fixture_out.is_absolute():
            fixture_out = ROOT / fixture_out
        fixture_out.parent.mkdir(parents=True, exist_ok=True)
        mask_fixture = {
            "id": "starter-empty-pool-sam2-multipoint",
            "width": width,
            "height": height,
            "model": "sam2-hiera-tiny-onnx-fp16",
            "promptStrategy": "One positive face centre. The other face centres and the reflected coping or deck point are negative.",
            "masks": {
                face: {"counts": encode_rle(selected_masks[face])}
                for face in FACE_ORDER
            },
            "luma": {
                "encoding": "deflate-base64",
                "data": base64.b64encode(zlib.compress(np.rint(
                    preview[:, :, 2] * 0.2126 +
                    preview[:, :, 1] * 0.7152 +
                    preview[:, :, 0] * 0.0722
                ).astype(np.uint8).tobytes(), 9)).decode("ascii"),
            },
        }
        fixture_out.write_text(json.dumps(mask_fixture, separators=(",", ":")) + "\n")
    print(json.dumps(report, indent=2))
    print(f"Wrote lab evidence to {args.out}")


if __name__ == "__main__":
    main()

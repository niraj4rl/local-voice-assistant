from __future__ import annotations

import re
from pathlib import Path


def to_snake_case(raw_name: str) -> str:
    stem = Path(raw_name).stem
    stem = re.sub(r"[^A-Za-z0-9]+", "_", stem).strip("_").lower()
    stem = re.sub(r"_+", "_", stem)
    return stem or "generated_file"


def sanitize_filename(raw_name: str, default_ext: str = ".txt") -> str:
    safe_stem = to_snake_case(raw_name)
    suffix = Path(raw_name).suffix.lower()
    if not suffix:
        suffix = default_ext
    if not re.fullmatch(r"\.[a-z0-9]{1,8}", suffix):
        suffix = default_ext
    return f"{safe_stem}{suffix}"


def ensure_path_inside(base_dir: Path, candidate: Path) -> None:
    resolved_base = base_dir.resolve()
    resolved_candidate = candidate.resolve()
    if resolved_base == resolved_candidate:
        return
    if resolved_base not in resolved_candidate.parents:
        raise ValueError("Unsafe path detected: target is outside output directory")

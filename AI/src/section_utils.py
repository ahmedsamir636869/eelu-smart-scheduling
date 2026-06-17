"""Utilities for section scheduling."""

from typing import List, Optional

import pandas as pd


def find_column(
    df: pd.DataFrame,
    candidates: List[str],
    required: bool = True,
) -> Optional[str]:
    """Find the first matching column name (case-insensitive)."""
    lowered = {str(c).strip().lower(): c for c in df.columns}
    for cand in candidates:
        if cand.lower() in lowered:
            return lowered[cand.lower()]
    if required:
        raise ValueError(
            f"Missing required column. Tried: {candidates}. Available: {list(df.columns)}"
        )
    return None

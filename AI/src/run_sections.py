"""CLI entry point for section scheduling (notebook equivalent)."""

import argparse
from pathlib import Path

from .section_loader import (
    DEFAULT_CP_OUTPUT_PATH,
    DEFAULT_DATA_PATH,
    DEFAULT_OUTPUT_PATH,
    DEFAULT_SDATA_PATH,
    SectionDataLoader,
)
from .section_scheduler import SectionScheduler


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(
        description="Generate combined CP + section schedule from Excel files."
    )
    parser.add_argument(
        "--cp-output",
        type=Path,
        default=project_root / DEFAULT_CP_OUTPUT_PATH,
        help="Path to Schedule_Output_CP.xlsx",
    )
    parser.add_argument(
        "--sdata",
        type=Path,
        default=project_root / DEFAULT_SDATA_PATH,
        help="Path to SData.xlsx",
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=project_root / DEFAULT_DATA_PATH,
        help="Path to Data.xlsx",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=project_root / DEFAULT_OUTPUT_PATH,
        help="Path for Schedule_Output_S.xlsx",
    )
    args = parser.parse_args()

    loader = SectionDataLoader()
    if not loader.load_from_excel(
        cp_output_path=args.cp_output,
        sdata_path=args.sdata,
        data_path=args.data,
    ):
        raise SystemExit("Failed to load section scheduling data.")

    scheduler = SectionScheduler(
        cp_schedule=loader.cp_schedule,
        rooms=loader.rooms,
        sections=loader.sections,
        assistants=loader.assistants,
        divisions=loader.divisions,
        courses=loader.courses,
        doctors=loader.doctors,
    )
    result = scheduler.run(output_path=args.output)

    print(f"Created: {result.written_path.resolve() if result.written_path else args.output}")
    print(
        f"CP rows: {len(result.cp_formatted)} | "
        f"Section rows: {len(result.section_schedule)} | "
        f"Total rows: {len(result.combined_schedule)} | "
        f"Unassigned: {result.unassigned_sections}"
    )


if __name__ == "__main__":
    main()

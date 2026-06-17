"""CLI entry point for CP scheduling (Final CP notebook equivalent)."""

import argparse
from pathlib import Path

from .data_loader import DEFAULT_CP_OUTPUT_PATH, DEFAULT_DATA_PATH, DataLoader
from .models import CPConfig
from .scheduler import SchedulingCP


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(
        description="Generate lecture schedule using OR-Tools CP-SAT."
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
        default=project_root / DEFAULT_CP_OUTPUT_PATH,
        help="Path for Schedule_Output_CP.xlsx",
    )
    parser.add_argument(
        "--time-limit",
        type=int,
        default=300,
        help="Solver time limit in seconds",
    )
    parser.add_argument(
        "--max-days-per-year",
        type=int,
        default=3,
        help="Maximum active days per academic year",
    )
    parser.add_argument(
        "--no-relax",
        action="store_true",
        help="Do not relax max_days_per_year if infeasible",
    )
    args = parser.parse_args()

    loader = DataLoader()
    if not loader.load_from_excel(args.data):
        raise SystemExit("Failed to load Data.xlsx")

    config = CPConfig(
        time_limit_seconds=args.time_limit,
        max_days_per_year=args.max_days_per_year,
        relax_if_infeasible=not args.no_relax,
    )

    cp = SchedulingCP(
        courses_df=loader.courses_df,
        rooms_df=loader.rooms_df,
        doctors_df=loader.doctors_df,
        divisions_df=loader.divisions_df,
        time_limit_seconds=config.time_limit_seconds,
        max_days_per_year=config.max_days_per_year,
        relax_if_infeasible=config.relax_if_infeasible,
    )

    best_schedule = cp.solve()
    if not best_schedule:
        raise SystemExit(
            f"No solution found (status: {cp.last_solver_status}). "
            "Try increasing --time-limit or --max-days-per-year."
        )

    _, schedule_df = cp.format_schedule(best_schedule)
    written_path = cp.save_schedule(schedule_df, args.output)

    print(f"Created: {written_path.resolve()}")
    print(
        f"Assignments: {len(schedule_df)} | "
        f"Solver: {cp.last_solver_status} | "
        f"max_days_per_year used: {cp.max_days_per_year}"
    )


if __name__ == "__main__":
    main()

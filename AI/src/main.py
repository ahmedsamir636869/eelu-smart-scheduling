"""FastAPI application for CP lecture + section scheduling."""

import time
import traceback
from pathlib import Path

import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .data_loader import DEFAULT_CP_OUTPUT_PATH, DEFAULT_DATA_PATH, DataLoader
from .models import (
    CPConfig,
    CPFileScheduleRequest,
    FullScheduleFileRequest,
    FullScheduleResponse,
    HealthResponse,
    ScheduleEntry,
    ScheduleRequest,
    ScheduleResponse,
    SectionFileScheduleRequest,
    SectionScheduleEntry,
    SectionScheduleRequest,
    SectionScheduleResponse,
)
from .scheduler import SchedulingCP
from .section_loader import (
    DEFAULT_OUTPUT_PATH,
    DEFAULT_SDATA_PATH,
    SectionDataLoader,
)
from .section_scheduler import SectionScheduler, dataframe_to_schedule_entries


PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _resolve_path(path: str | None, default: Path) -> Path:
    if not path:
        return PROJECT_ROOT / default
    candidate = Path(path)
    if candidate.is_absolute():
        return candidate
    return PROJECT_ROOT / candidate


def _build_section_response(
    result, elapsed_seconds: float, message: str
) -> SectionScheduleResponse:
    combined = dataframe_to_schedule_entries(result.combined_schedule)
    cp_only = dataframe_to_schedule_entries(result.cp_formatted)
    sections_only = dataframe_to_schedule_entries(result.section_schedule)

    return SectionScheduleResponse(
        success=True,
        message=message,
        schedule=[SectionScheduleEntry(**entry) for entry in combined],
        cp_schedule=[SectionScheduleEntry(**entry) for entry in cp_only],
        sections_schedule=[SectionScheduleEntry(**entry) for entry in sections_only],
        cp_rows=len(result.cp_formatted),
        section_rows=len(result.section_schedule),
        total_rows=len(result.combined_schedule),
        unassigned_sections=result.unassigned_sections,
        output_path=str(result.written_path.resolve()) if result.written_path else None,
        elapsed_seconds=elapsed_seconds,
    )


def _run_cp(
    loader: DataLoader,
    config: CPConfig,
    write_output: bool,
    output_path: Path | None,
) -> tuple[ScheduleResponse, SchedulingCP, pd.DataFrame]:
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
        raise HTTPException(
            status_code=422,
            detail=(
                f"CP solver found no solution (status: {cp.last_solver_status}). "
                "Try increasing time_limit_seconds or max_days_per_year."
            ),
        )

    formatted, schedule_df = cp.format_schedule(best_schedule)
    written_path = None
    if write_output and output_path is not None:
        written_path = cp.save_schedule(schedule_df, output_path)

    return (
        ScheduleResponse(
            success=True,
            message=(
                f"CP schedule generated with {len(formatted)} assignments "
                f"(solver: {cp.last_solver_status}, "
                f"max_days_per_year={cp.max_days_per_year})"
            ),
            schedule=[ScheduleEntry(**entry) for entry in formatted],
            total_assignments=len(formatted),
            solver_status=cp.last_solver_status,
            max_days_per_year_used=cp.max_days_per_year,
            output_path=str(written_path.resolve()) if written_path else None,
        ),
        cp,
        schedule_df,
    )


app = FastAPI(
    title="CP Scheduler API",
    description="Constraint Programming course scheduling and section scheduling microservice",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=dict)
async def root():
    return {
        "name": "CP Scheduler API",
        "version": "2.0.0",
        "description": "Constraint Programming lecture + section scheduling",
        "endpoints": {
            "health": "/health",
            "cp_generate": "/cp/generate",
            "cp_generate_from_files": "/cp/generate-from-files",
            "sections_generate": "/sections/generate",
            "sections_generate_from_files": "/sections/generate-from-files",
            "full_schedule_from_files": "/schedule/full-from-files",
            "docs": "/docs",
        },
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        message=(
            "API is running. Use /cp/generate for lecture scheduling or "
            "/sections/generate for section scheduling."
        ),
        version="2.0.0",
    )


@app.post("/cp/generate", response_model=ScheduleResponse)
async def generate_cp_schedule(request: ScheduleRequest):
    """Generate a lecture schedule using OR-Tools CP-SAT."""
    config = request.config or CPConfig()

    try:
        start_time = time.time()
        loader = DataLoader()
        json_data = {
            "rooms": [room.model_dump() for room in request.data.rooms],
            "courses": [course.model_dump() for course in request.data.courses],
            "doctors": [doctor.model_dump() for doctor in request.data.doctors],
            "divisions": [division.model_dump() for division in request.data.divisions],
        }

        if not loader.load_from_json(json_data):
            raise HTTPException(status_code=400, detail="Failed to parse JSON data")

        output_path = None
        if request.write_output:
            output_path = _resolve_path(request.output_path, DEFAULT_CP_OUTPUT_PATH)

        response, _, _ = _run_cp(loader, config, request.write_output, output_path)
        response.elapsed_seconds = time.time() - start_time
        response.message = f"{response.message} in {response.elapsed_seconds:.2f}s"
        return response

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error generating CP schedule: {exc}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/cp/generate-from-files", response_model=ScheduleResponse)
async def generate_cp_from_files(request: CPFileScheduleRequest):
    """Generate CP schedule from Data.xlsx (Final CP notebook)."""
    config = request.config or CPConfig()

    try:
        start_time = time.time()
        data_path = _resolve_path(request.data_path, DEFAULT_DATA_PATH)

        if not data_path.exists():
            raise HTTPException(status_code=404, detail=f"Data file not found: {data_path}")

        loader = DataLoader()
        if not loader.load_from_excel(data_path):
            raise HTTPException(status_code=400, detail="Failed to load Data.xlsx")

        output_path = None
        if request.write_output:
            output_path = _resolve_path(request.output_path, DEFAULT_CP_OUTPUT_PATH)

        response, _, _ = _run_cp(loader, config, request.write_output, output_path)
        response.elapsed_seconds = time.time() - start_time
        response.message = f"{response.message} in {response.elapsed_seconds:.2f}s"
        return response

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error generating CP schedule from files: {exc}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/sections/generate", response_model=SectionScheduleResponse)
async def generate_sections(request: SectionScheduleRequest):
    """Generate combined CP + section schedule from JSON."""
    try:
        start_time = time.time()
        loader = SectionDataLoader()
        json_data = {
            "cp_schedule": [row.model_dump() for row in request.data.cp_schedule],
            "rooms": [row.model_dump(exclude_none=True) for row in request.data.rooms],
            "sections": [row.model_dump(exclude_none=True) for row in request.data.sections],
            "assistants": [
                row.model_dump(exclude_none=True) for row in request.data.assistants
            ],
            "divisions": [row.model_dump() for row in request.data.divisions],
            "courses": [row.model_dump() for row in request.data.courses],
            "doctors": [row.model_dump() for row in request.data.doctors],
        }

        if not loader.load_from_json(json_data):
            raise HTTPException(status_code=400, detail="Failed to parse section JSON data")

        output_path = None
        if request.write_output:
            output_path = _resolve_path(request.output_path, DEFAULT_OUTPUT_PATH)

        scheduler = SectionScheduler(
            cp_schedule=loader.cp_schedule,
            rooms=loader.rooms,
            sections=loader.sections,
            assistants=loader.assistants,
            divisions=loader.divisions,
            courses=loader.courses,
            doctors=loader.doctors,
        )
        result = scheduler.run(output_path=output_path)
        elapsed = time.time() - start_time

        message = (
            f"Section schedule generated in {elapsed:.2f}s "
            f"({len(result.cp_formatted)} CP rows, {len(result.section_schedule)} section rows)"
        )
        if result.written_path:
            message += f". Written to {result.written_path.resolve()}"

        return _build_section_response(result, elapsed, message)

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error generating section schedule: {exc}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/sections/generate-from-files", response_model=SectionScheduleResponse)
async def generate_sections_from_files(request: SectionFileScheduleRequest):
    """Generate section schedule from Excel (Final S Cp notebook)."""
    try:
        start_time = time.time()
        cp_path = _resolve_path(request.cp_output_path, DEFAULT_CP_OUTPUT_PATH)
        sdata_path = _resolve_path(request.sdata_path, DEFAULT_SDATA_PATH)
        data_path = _resolve_path(request.data_path, DEFAULT_DATA_PATH)

        for label, path in [("CP output", cp_path), ("SData", sdata_path), ("Data", data_path)]:
            if not path.exists():
                raise HTTPException(status_code=404, detail=f"{label} file not found: {path}")

        loader = SectionDataLoader()
        if not loader.load_from_excel(
            cp_output_path=cp_path,
            sdata_path=sdata_path,
            data_path=data_path,
        ):
            raise HTTPException(status_code=400, detail="Failed to load section Excel data")

        output_path = None
        if request.write_output:
            output_path = _resolve_path(request.output_path, DEFAULT_OUTPUT_PATH)

        scheduler = SectionScheduler(
            cp_schedule=loader.cp_schedule,
            rooms=loader.rooms,
            sections=loader.sections,
            assistants=loader.assistants,
            divisions=loader.divisions,
            courses=loader.courses,
            doctors=loader.doctors,
        )
        result = scheduler.run(output_path=output_path)
        elapsed = time.time() - start_time

        stats = loader.get_stats()
        message = (
            f"Section schedule from files in {elapsed:.2f}s "
            f"(CP rows: {stats['cp_rows']}, sections: {stats['sections_rows']})"
        )
        if result.written_path:
            message += f". Written to {result.written_path.resolve()}"

        return _build_section_response(result, elapsed, message)

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error generating section schedule from files: {exc}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/schedule/full-from-files", response_model=FullScheduleResponse)
async def generate_full_schedule_from_files(request: FullScheduleFileRequest):
    """Run Final CP then Final S Cp in one pipeline."""
    config = request.cp_config or CPConfig()

    try:
        start_time = time.time()
        data_path = _resolve_path(request.data_path, DEFAULT_DATA_PATH)
        sdata_path = _resolve_path(request.sdata_path, DEFAULT_SDATA_PATH)
        cp_output_path = _resolve_path(request.cp_output_path, DEFAULT_CP_OUTPUT_PATH)
        final_output_path = _resolve_path(request.output_path, DEFAULT_OUTPUT_PATH)

        if not data_path.exists():
            raise HTTPException(status_code=404, detail=f"Data file not found: {data_path}")
        if not sdata_path.exists():
            raise HTTPException(status_code=404, detail=f"SData file not found: {sdata_path}")

        cp_loader = DataLoader()
        if not cp_loader.load_from_excel(data_path):
            raise HTTPException(status_code=400, detail="Failed to load Data.xlsx")

        cp_response, _, schedule_df = _run_cp(
            cp_loader,
            config,
            write_output=request.write_output,
            output_path=cp_output_path if request.write_output else None,
        )

        section_loader = SectionDataLoader()
        if not section_loader.load_section_sheets(
            sdata_path=sdata_path,
            data_path=data_path,
            cp_schedule=schedule_df,
        ):
            raise HTTPException(status_code=400, detail="Failed to load section data")

        section_scheduler = SectionScheduler(
            cp_schedule=section_loader.cp_schedule,
            rooms=section_loader.rooms,
            sections=section_loader.sections,
            assistants=section_loader.assistants,
            divisions=section_loader.divisions,
            courses=section_loader.courses,
            doctors=section_loader.doctors,
        )
        section_result = section_scheduler.run(
            output_path=final_output_path if request.write_output else None
        )

        elapsed = time.time() - start_time
        cp_response.elapsed_seconds = elapsed

        section_message = (
            f"Full pipeline completed in {elapsed:.2f}s "
            f"({len(section_result.cp_formatted)} CP + {len(section_result.section_schedule)} sections)"
        )
        if section_result.written_path:
            section_message += f". Written to {section_result.written_path.resolve()}"

        return FullScheduleResponse(
            success=True,
            message=section_message,
            cp_result=cp_response,
            section_result=_build_section_response(section_result, elapsed, section_message),
        )

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error in full schedule pipeline: {exc}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)

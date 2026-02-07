"""
FastAPI application for the GA Scheduler microservice.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time

from .models import (
    ScheduleRequest, 
    ScheduleResponse, 
    ScheduleEntry,
    HealthResponse,
    GAConfig
)
from .data_loader import DataLoader
from .scheduler import SchedulingGA


# Initialize FastAPI app
app = FastAPI(
    title="GA Scheduler API",
    description="Genetic Algorithm based course scheduling microservice",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware for Node.js backend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information."""
    return {
        "name": "GA Scheduler API",
        "version": "1.0.0",
        "description": "Genetic Algorithm based course scheduling microservice",
        "endpoints": {
            "health": "/health",
            "generate_schedule": "/schedule/generate",
            "docs": "/docs"
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        message="API is running. Send JSON data to /schedule/generate to create a schedule.",
        version="1.0.0"
    )


@app.post("/schedule/generate", response_model=ScheduleResponse)
async def generate_schedule(request: ScheduleRequest):
    """Generate a schedule using the Genetic Algorithm.
    
    Args:
        request: JSON data containing rooms, courses, doctors, divisions and optional GA config.
        
    Returns:
        Generated schedule with metadata.
    """
    # Get GA configuration
    config = request.config if request.config else GAConfig()
    
    try:
        start_time = time.time()
        
        # Create DataLoader and load from JSON
        data_loader = DataLoader()
        
        # Convert Pydantic models to dicts
        json_data = {
            'rooms': [room.model_dump() for room in request.data.rooms],
            'courses': [course.model_dump() for course in request.data.courses],
            'doctors': [doctor.model_dump() for doctor in request.data.doctors],
            'divisions': [division.model_dump() for division in request.data.divisions]
        }
        
        if not data_loader.load_from_json(json_data):
            raise HTTPException(
                status_code=400,
                detail="Failed to parse the provided JSON data"
            )
        
        stats = data_loader.get_stats()
        print(f"Data loaded from JSON: {stats}")
        
        # Initialize and run the GA
        ga = SchedulingGA(
            data_loader=data_loader,
            pop_size=config.population_size,
            generations=config.generations,
            mutation_rate=config.mutation_rate,
            crossover_rate=config.crossover_rate
        )
        
        best_schedule, fitness_history = ga.run()
        
        # Format the schedule for output
        formatted_schedule = ga.format_schedule(best_schedule)
        
        # Convert to ScheduleEntry models
        schedule_entries = [ScheduleEntry(**entry) for entry in formatted_schedule]
        
        elapsed_time = time.time() - start_time
        
        return ScheduleResponse(
            success=True,
            message=f"Schedule generated successfully in {elapsed_time:.2f}s",
            schedule=schedule_entries,
            total_assignments=len(schedule_entries),
            fitness_score=fitness_history[-1] if fitness_history else 0.0,
            generations_run=config.generations
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error generating schedule: {str(e)}")
        print(f"Traceback: {error_traceback}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating schedule: {str(e)}"
        )


# Entry point for running directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
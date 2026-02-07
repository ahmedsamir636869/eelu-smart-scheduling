"""
Test script to run the scheduler with the updated penalty weights.
This will regenerate the schedule and save it to the output file.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from src.data_loader import DataLoader
from src.scheduler import SchedulingGA
import pandas as pd

def main():
    print("=" * 60)
    print("Running GA Scheduler with Updated Conflict Penalties")
    print("=" * 60)
    
    # Load data from Excel
    data_file = Path(__file__).parent.parent / 'Data.xlsx'
    
    if not data_file.exists():
        print(f"Error: Data file not found: {data_file}")
        return
    
    print(f"\nLoading data from: {data_file}")
    
    # Load Excel data
    rooms_df = pd.read_excel(data_file, sheet_name='Rooms')
    courses_df = pd.read_excel(data_file, sheet_name='Courses')
    doctors_df = pd.read_excel(data_file, sheet_name='Doctors')
    divisions_df = pd.read_excel(data_file, sheet_name='Division')
    
    # Convert to JSON format
    json_data = {
        'rooms': rooms_df.to_dict('records'),
        'courses': courses_df.to_dict('records'),
        'doctors': doctors_df.to_dict('records'),
        'divisions': divisions_df.to_dict('records')
    }
    
    data_loader = DataLoader()
    if not data_loader.load_from_json(json_data):
        print("Failed to load data")
        return
    
    stats = data_loader.get_stats()
    print(f"\nData loaded successfully:")
    print(f"  - Rooms: {stats['rooms']}")
    print(f"  - Courses: {stats['courses']}")
    print(f"  - Instructors: {stats['doctors']}")
    print(f"  - Divisions: {stats['divisions']}")
    
    # Initialize and run GA with updated parameters
    print("\nInitializing Genetic Algorithm...")
    print("  - Population size: 50")
    print("  - Generations: 100")
    print("  - Mutation rate: 0.15")
    print("  - Crossover rate: 0.8")
    print("  - Room conflict penalty: 1000 (increased from 50)")
    print("  - Division conflict penalty: 1000 (increased from 50)")
    print("  - Instructor conflict penalty: 1000 (unchanged)")
    
    ga = SchedulingGA(
        data_loader=data_loader,
        pop_size=50,
        generations=5,
        mutation_rate=0.15,
        crossover_rate=0.8
    )
    
    print("\nRunning genetic algorithm...")
    best_schedule, fitness_history = ga.run()
    
    # Format and save the schedule
    print("\nFormatting schedule...")
    formatted_schedule = ga.format_schedule(best_schedule)
    
    # Save to Excel
    output_file = Path(__file__).parent / 'data' / 'Processed Data' / 'Schedule_Output.xlsx'
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    df = pd.DataFrame(formatted_schedule)
    
    # Capitalize column names to match expected format
    df.columns = [col.replace('_', ' ').title().replace(' ', '_') for col in df.columns]
    
    df.to_excel(output_file, index=False)
    
    # Also save to JSON for validation
    json_output_file = Path(__file__).parent / 'latest_schedule.json'
    import json
    # Wrap in expected structure
    json_data = {
        'semester': 'Spring 2024',
        'generatedBy': 'AI-GA',
        'createdAt': '2024-02-12T12:00:00Z',
        'sessions': formatted_schedule
    }
    with open(json_output_file, 'w') as f:
        json.dump(json_data, f, indent=2)
    print(f"[OK] Schedule saved to: {json_output_file}")
    
    print(f"\n[OK] Schedule saved to: {output_file}")
    print(f"  Total sessions: {len(formatted_schedule)}")
    print(f"  Final fitness score: {fitness_history[-1]:.2f}")
    
    print("\n" + "=" * 60)
    print("Schedule generation complete!")
    print("=" * 60)
    
    # Run conflict checker
    print("\nRunning conflict checker on generated schedule...")
    import subprocess
    result = subprocess.run(
        ['python', 'check_conflicts.py'],
        cwd=Path(__file__).parent,
        capture_output=True,
        text=True
    )
    print(result.stdout)
    if result.stderr:
        print("Errors:", result.stderr)

if __name__ == "__main__":
    main()

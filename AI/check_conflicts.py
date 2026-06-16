"""
Diagnostic script to check for scheduling conflicts in generated schedules.
"""

import pandas as pd
import sys
from pathlib import Path

def check_room_conflicts(schedule_df):
    """Check for room conflicts (same room, same day, overlapping times)."""
    conflicts = []
    
    # Group by day and room
    for (day, room), group in schedule_df.groupby(['Day', 'Room']):
        # Sort by start time
        sorted_group = group.sort_values('Start_Time')
        
        # Check for overlaps
        for i in range(len(sorted_group)):
            for j in range(i + 1, len(sorted_group)):
                row_i = sorted_group.iloc[i]
                row_j = sorted_group.iloc[j]
                
                # Check if times overlap
                if row_i['End_Time'] > row_j['Start_Time']:
                    conflicts.append({
                        'type': 'ROOM_CONFLICT',
                        'room': room,
                        'day': day,
                        'session_1': {
                            'course': row_i.get('Course_Name', 'Unknown'),
                            'instructor': row_i.get('Instructor_Name', 'Unknown'),
                            'time': f"{row_i['Start_Time']} - {row_i['End_Time']}",
                            'students': row_i.get('Students', 0)
                        },
                        'session_2': {
                            'course': row_j.get('Course_Name', 'Unknown'),
                            'instructor': row_j.get('Instructor_Name', 'Unknown'),
                            'time': f"{row_j['Start_Time']} - {row_j['End_Time']}",
                            'students': row_j.get('Students', 0)
                        }
                    })
    
    return conflicts

def check_instructor_conflicts(schedule_df):
    """Check for instructor conflicts (same instructor, same day, overlapping times)."""
    conflicts = []
    
    # Group by day and instructor
    for (day, instructor), group in schedule_df.groupby(['Day', 'Instructor_Name']):
        # Sort by start time
        sorted_group = group.sort_values('Start_Time')
        
        # Check for overlaps
        for i in range(len(sorted_group)):
            for j in range(i + 1, len(sorted_group)):
                row_i = sorted_group.iloc[i]
                row_j = sorted_group.iloc[j]
                
                # Check if times overlap
                if row_i['End_Time'] > row_j['Start_Time']:
                    conflicts.append({
                        'type': 'INSTRUCTOR_CONFLICT',
                        'instructor': instructor,
                        'day': day,
                        'session_1': {
                            'course': row_i.get('Course_Name', 'Unknown'),
                            'room': row_i.get('Room', 'Unknown'),
                            'time': f"{row_i['Start_Time']} - {row_i['End_Time']}"
                        },
                        'session_2': {
                            'course': row_j.get('Course_Name', 'Unknown'),
                            'room': row_j.get('Room', 'Unknown'),
                            'time': f"{row_j['Start_Time']} - {row_j['End_Time']}"
                        }
                    })
    
    return conflicts

def main():
    # Check if file path is provided
    if len(sys.argv) > 1:
        schedule_file = sys.argv[1]
    else:
        schedule_file = 'AI/data/Processed Data/Schedule_Output.xlsx'
    
    if not Path(schedule_file).exists():
        print(f"[ERROR] Schedule file not found: {schedule_file}")
        return
    
    print(f"[INFO] Analyzing schedule: {schedule_file}\n")
    
    # Load schedule
    schedule_df = pd.read_excel(schedule_file)
    
    print(f"Total sessions: {len(schedule_df)}")
    print(f"Columns: {schedule_df.columns.tolist()}\n")
    
    # Check for room conflicts
    print("[CHECK] Checking for room conflicts...")
    room_conflicts = check_room_conflicts(schedule_df)
    
    if room_conflicts:
        print(f"[CONFLICT] Found {len(room_conflicts)} room conflict(s):\n")
        for idx, conflict in enumerate(room_conflicts, 1):
            print(f"Conflict #{idx}:")
            print(f"  Room: {conflict['room']}")
            print(f"  Day: {conflict['day']}")
            print(f"  Session 1: {conflict['session_1']['course']} ({conflict['session_1']['instructor']})")
            print(f"    Time: {conflict['session_1']['time']}, Students: {conflict['session_1']['students']}")
            print(f"  Session 2: {conflict['session_2']['course']} ({conflict['session_2']['instructor']})")
            print(f"    Time: {conflict['session_2']['time']}, Students: {conflict['session_2']['students']}")
            print()
    else:
        print("[OK] No room conflicts found!\n")
    
    # Check for instructor conflicts
    print("[CHECK] Checking for instructor conflicts...")
    instructor_conflicts = check_instructor_conflicts(schedule_df)
    
    if instructor_conflicts:
        print(f"[CONFLICT] Found {len(instructor_conflicts)} instructor conflict(s):\n")
        for idx, conflict in enumerate(instructor_conflicts, 1):
            print(f"Conflict #{idx}:")
            print(f"  Instructor: {conflict['instructor']}")
            print(f"  Day: {conflict['day']}")
            print(f"  Session 1: {conflict['session_1']['course']} in {conflict['session_1']['room']}")
            print(f"    Time: {conflict['session_1']['time']}")
            print(f"  Session 2: {conflict['session_2']['course']} in {conflict['session_2']['room']}")
            print(f"    Time: {conflict['session_2']['time']}")
            print()
    else:
        print("[OK] No instructor conflicts found!\n")
    
    # Summary
    total_conflicts = len(room_conflicts) + len(instructor_conflicts)
    if total_conflicts == 0:
        print("[SUCCESS] Schedule is conflict-free!")
    else:
        print(f"[WARNING] Total conflicts found: {total_conflicts}")
        print(f"   - Room conflicts: {len(room_conflicts)}")
        print(f"   - Instructor conflicts: {len(instructor_conflicts)}")

if __name__ == "__main__":
    main()

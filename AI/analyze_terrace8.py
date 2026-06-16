"""
Analyze Terrace 8 scheduling conflicts by day.
"""

import pandas as pd
from pathlib import Path

# Load schedule
schedule_file = Path(__file__).parent / 'data' / 'Processed Data' / 'Schedule_Output.xlsx'
df = pd.read_excel(schedule_file)

# Filter for Terrace 8
t8 = df[df['Room'] == 'Terrace 8'].sort_values(['Day', 'Start_Time'])

print("=" * 70)
print("TERRACE 8 SCHEDULE ANALYSIS")
print("=" * 70)

# Show sessions by day
for day in ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']:
    day_sessions = t8[t8['Day'] == day].sort_values('Start_Time')
    
    if len(day_sessions) == 0:
        continue
        
    print(f"\n{day}: {len(day_sessions)} sessions")
    print("-" * 70)
    
    # Check for conflicts on this day
    conflicts = []
    for i in range(len(day_sessions)):
        for j in range(i + 1, len(day_sessions)):
            r1 = day_sessions.iloc[i]
            r2 = day_sessions.iloc[j]
            
            # Check if times overlap
            if r1['End_Time'] > r2['Start_Time']:
                conflicts.append((r1, r2))
    
    # Display sessions
    for idx, row in day_sessions.iterrows():
        print(f"  {row['Start_Time']:>8} - {row['End_Time']:<8} | {row['Course_Name']:<45} | {row['Students']:>3} students")
    
    # Display conflicts for this day
    if conflicts:
        print(f"\n  [CONFLICT] {len(conflicts)} conflict(s) detected on {day}:")
        for r1, r2 in conflicts:
            print(f"    - {r1['Start_Time']} - {r1['End_Time']}: {r1['Course_Name']}")
            print(f"    - {r2['Start_Time']} - {r2['End_Time']}: {r2['Course_Name']}")
            print()

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

# Count total conflicts
total_conflicts = 0
for day in df['Day'].unique():
    day_t8 = t8[t8['Day'] == day]
    day_conflicts = 0
    
    for i in range(len(day_t8)):
        for j in range(i + 1, len(day_t8)):
            r1 = day_t8.iloc[i]
            r2 = day_t8.iloc[j]
            if r1['End_Time'] > r2['Start_Time']:
                day_conflicts += 1
    
    if day_conflicts > 0:
        print(f"{day}: {day_conflicts} conflict(s)")
        total_conflicts += day_conflicts

print(f"\nTotal Terrace 8 conflicts: {total_conflicts}")

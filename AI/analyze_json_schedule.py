"""Analyze JSON schedule for room conflicts."""
import json
from datetime import datetime

# Load the JSON file
with open(r'C:\Users\wwwco\Downloads\eelu-smart-scheduling\eelu-smart-scheduling\schedule_Fall_2024_2026-02-07 (3).json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Schedule ID: {data['scheduleId']}")
print(f"Total Sessions: {data['totalSessions']}")
print()

# Group sessions by room and day
room_day_sessions = {}
for session in data['sessions']:
    room = session['room']
    day = session['day']
    key = (room, day)
    if key not in room_day_sessions:
        room_day_sessions[key] = []
    room_day_sessions[key].append(session)

# Check for conflicts
def parse_time(time_str):
    """Parse ISO datetime to get hour"""
    dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
    return dt.hour * 60 + dt.minute  # Return minutes since midnight

def times_overlap(start1, end1, start2, end2):
    """Check if two time ranges overlap"""
    return start1 < end2 and start2 < end1

conflicts = []
for (room, day), sessions in room_day_sessions.items():
    # Sort by start time
    sessions_sorted = sorted(sessions, key=lambda s: parse_time(s['startTime']))
    
    # Check for overlaps
    for i, s1 in enumerate(sessions_sorted):
        for j, s2 in enumerate(sessions_sorted):
            if i >= j:
                continue
            
            start1 = parse_time(s1['startTime'])
            end1 = parse_time(s1['endTime'])
            start2 = parse_time(s2['startTime'])
            end2 = parse_time(s2['endTime'])
            
            if times_overlap(start1, end1, start2, end2):
                conflicts.append({
                    'room': room,
                    'day': day,
                    'session1': s1,
                    'session2': s2
                })

# Print conflicts
if conflicts:
    print(f"FOUND {len(conflicts)} ROOM CONFLICTS:")
    print("=" * 80)
    for c in conflicts:
        s1 = c['session1']
        s2 = c['session2']
        start1 = datetime.fromisoformat(s1['startTime'].replace('Z', '+00:00')).strftime('%H:%M')
        start2 = datetime.fromisoformat(s2['startTime'].replace('Z', '+00:00')).strftime('%H:%M')
        end1 = datetime.fromisoformat(s1['endTime'].replace('Z', '+00:00')).strftime('%H:%M')
        end2 = datetime.fromisoformat(s2['endTime'].replace('Z', '+00:00')).strftime('%H:%M')
        
        print(f"\nRoom: {c['room']} | Day: {c['day']}")
        print(f"  Session 1: {s1['courseName']} ({start1} - {end1})")
        print(f"            Instructor: {s1['instructor']}, Students: {s1['studentCount']}")
        print(f"  Session 2: {s2['courseName']} ({start2} - {end2})")
        print(f"            Instructor: {s2['instructor']}, Students: {s2['studentCount']}")
else:
    print("NO ROOM CONFLICTS FOUND!")

# Also show room usage count per day
print("\n" + "=" * 80)
print("ROOM USAGE PER DAY:")
print("=" * 80)
for (room, day), sessions in sorted(room_day_sessions.items()):
    print(f"{room} on {day}: {len(sessions)} sessions")

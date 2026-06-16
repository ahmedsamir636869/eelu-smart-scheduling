"""Analyze schedule for room capacity conflicts and division conflicts using Data.xlsx."""
import json
import pandas as pd
from datetime import datetime

# Load the JSON schedule
with open(r'latest_schedule.json', 'r', encoding='utf-8') as f:
    schedule_data = json.load(f)

# Load the Excel data
excel_path = r'C:\Users\wwwco\Downloads\eelu-smart-scheduling\eelu-smart-scheduling\Data.xlsx'

# Read rooms data
rooms_df = pd.read_excel(excel_path, sheet_name='Rooms')
print("=== ROOMS DATA ===")
print(rooms_df.to_string())
print()

# Read divisions data
divisions_df = pd.read_excel(excel_path, sheet_name='Division')
print("=== DIVISIONS DATA ===")
print(divisions_df.to_string())
print()

# Create room capacity lookup
room_capacity = {}
for _, row in rooms_df.iterrows():
    room_id = str(row['Room_ID']).strip()
    room_name = str(row['Room']).strip()
    capacity = int(row['Capacity'])
    room_type = str(row['Type']).strip()
    # Store both Room_ID and Room name for lookup
    room_capacity[room_id] = {'capacity': capacity, 'type': room_type}
    room_capacity[room_name] = {'capacity': capacity, 'type': room_type}
    print(f"Room: {room_name} ({room_id}) -> Capacity: {capacity}, Type: {room_type}")

print()

def parse_time(time_str):
    """Parse time string to minutes since midnight. Supports ISO and 'HH:MM AM/PM'."""
    try:
        # Try ISO format first
        dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        return dt.hour * 60 + dt.minute
    except ValueError:
        try:
            # Try HH:MM AM/PM format (e.g. "01:00 PM")
            t = datetime.strptime(time_str, "%I:%M %p").time()
            return t.hour * 60 + t.minute
        except ValueError:
            # Try HH:MM (24-hour)
             t = datetime.strptime(time_str, "%H:%M").time()
             return t.hour * 60 + t.minute

def times_overlap(start1, end1, start2, end2):
    """Check if two time ranges overlap"""
    return start1 < end2 and start2 < end1

# === CHECK CAPACITY CONFLICTS ===
print("=== CAPACITY CONFLICTS IN SCHEDULE ===")
print()

capacity_conflicts = []
room_conflicts = []
division_conflicts = []

# Group sessions by room and day for room conflict detection
room_day_sessions = {}
# Group sessions by division (group) and day for division conflict detection
division_day_sessions = {}

for session in schedule_data['sessions']:
    room = session['room']
    # Use offline_students if available (Hybrid Logic), otherwise total students
    students = session.get('offline_students', session.get('studentCount', 0))
    group = session.get('group', session.get('division', 'Unknown'))
    day = session['day']
    
    # Check capacity
    if room in room_capacity:
        capacity = room_capacity[room]['capacity']
        if students > capacity:
            capacity_conflicts.append({
                'room': room,
                'room_capacity': capacity,
                'students': students,
                'overflow': students - capacity,
                'course': session['courseName'],
                'day': day,
                'time': session['startTime'],
                'group': group
            })
    else:
        print(f"WARNING: Room '{room}' not found in Rooms sheet!")
    
    # Track for room conflicts
    room_key = (room, day)
    if room_key not in room_day_sessions:
        room_day_sessions[room_key] = []
    room_day_sessions[room_key].append(session)
    
    # Track for division conflicts
    div_key = (group, day)
    if div_key not in division_day_sessions:
        division_day_sessions[div_key] = []
    division_day_sessions[div_key].append(session)

# Print capacity conflicts
if capacity_conflicts:
    print(f"FOUND {len(capacity_conflicts)} CAPACITY CONFLICTS:")
    print("-" * 80)
    for c in sorted(capacity_conflicts, key=lambda x: -x['overflow']):
        time_str = datetime.fromisoformat(c['time'].replace('Z', '+00:00')).strftime('%H:%M')
        print(f"  Room: {c['room']} (capacity={c['room_capacity']}) | Students: {c['students']} | Overflow: +{c['overflow']}")
        print(f"         Course: {c['course']} | Group: {c['group']} | {c['day']} {time_str}")
        print()
else:
    print("NO CAPACITY CONFLICTS FOUND!")

# === CHECK ROOM CONFLICTS ===
print()
print("=== ROOM CONFLICTS (Double Booking) ===")
print()

for (room, day), sessions in room_day_sessions.items():
    sessions_sorted = sorted(sessions, key=lambda s: parse_time(s.get('startTime', s.get('start_time'))))
    
    for i, s1 in enumerate(sessions_sorted):
        for j, s2 in enumerate(sessions_sorted):
            if i >= j:
                continue
            
            # Support both camelCase and snake_case keys
            st_key = 'startTime' if 'startTime' in s1 else 'start_time'
            et_key = 'endTime' if 'endTime' in s1 else 'end_time'
            
            start1 = parse_time(s1[st_key])
            end1 = parse_time(s1[et_key])
            start2 = parse_time(s2[st_key])
            end2 = parse_time(s2[et_key])
            
            if times_overlap(start1, end1, start2, end2):
                room_conflicts.append({
                    'room': room,
                    'day': day,
                    'session1': s1,
                    'session2': s2
                })

if room_conflicts:
    print(f"FOUND {len(room_conflicts)} ROOM CONFLICTS:")
    print("-" * 80)
    for c in room_conflicts:
        s1 = c['session1']
        s2 = c['session2']
        start1 = datetime.fromisoformat(s1['startTime'].replace('Z', '+00:00')).strftime('%H:%M')
        start2 = datetime.fromisoformat(s2['startTime'].replace('Z', '+00:00')).strftime('%H:%M')
        print(f"  Room: {c['room']} | Day: {c['day']}")
        print(f"    Session 1: {s1['courseName']} at {start1}")
        print(f"    Session 2: {s2['courseName']} at {start2}")
        print()
else:
    print("NO ROOM CONFLICTS FOUND!")

# === CHECK DIVISION CONFLICTS ===
print()
print("=== DIVISION CONFLICTS (Same students at same time) ===")
print()

for (group, day), sessions in division_day_sessions.items():
    if group == 'Unknown':
        continue
    
    sessions_sorted = sorted(sessions, key=lambda s: parse_time(s.get('startTime', s.get('start_time'))))
    
    for i, s1 in enumerate(sessions_sorted):
        for j, s2 in enumerate(sessions_sorted):
            if i >= j:
                continue
            
            # Support both camelCase and snake_case keys
            start1 = parse_time(s1.get('startTime', s1.get('start_time')))
            end1 = parse_time(s1.get('endTime', s1.get('end_time')))
            start2 = parse_time(s2.get('startTime', s2.get('start_time')))
            end2 = parse_time(s2.get('endTime', s2.get('end_time')))
            
            if times_overlap(start1, end1, start2, end2):
                # Check if it's the same course (split session) - if so, it's NOT a conflict
                c1_name = s1.get('courseName', s1.get('course_name'))
                c2_name = s2.get('courseName', s2.get('course_name'))
                if c1_name == c2_name:
                    continue
                    
                division_conflicts.append({
                    'group': group,
                    'day': day,
                    'session1': s1,
                    'session2': s2
                })

if division_conflicts:
    print(f"FOUND {len(division_conflicts)} DIVISION CONFLICTS:")
    print("-" * 80)
    for c in division_conflicts:
        s1 = c['session1']
        s2 = c['session2']
        
        # Support both formats
        st_key1 = 'startTime' if 'startTime' in s1 else 'start_time'
        st_key2 = 'startTime' if 'startTime' in s2 else 'start_time'
        c_key1 = 'courseName' if 'courseName' in s1 else 'course_name'
        c_key2 = 'courseName' if 'courseName' in s2 else 'course_name'
        
        try:
             start1 = s1[st_key1]
        except:
             start1 = "Unknown"
             
        try:
             start2 = s2[st_key2]
        except:
             start2 = "Unknown"

        c1 = s1.get(c_key1, 'Unknown')
        c2 = s2.get(c_key2, 'Unknown')
        
        print(f"  Division/Group: {c['group']} | Day: {c['day']}")
        print(f"    Session 1: {c1} at {start1}")
        print(f"    Session 2: {c2} at {start2}")
        print()
else:
    print("NO DIVISION CONFLICTS FOUND!")

print()
print("=== SUMMARY ===")
print(f"Total Sessions: {len(schedule_data['sessions'])}")
print(f"Capacity Conflicts: {len(capacity_conflicts)}")
print(f"Room Conflicts: {len(room_conflicts)}")
print(f"Division Conflicts: {len(division_conflicts)}")

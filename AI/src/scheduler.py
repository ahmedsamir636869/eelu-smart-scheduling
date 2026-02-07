"""
Genetic Algorithm Scheduler.
Refactored from the notebook implementation.
"""

import random
import copy
from typing import List, Dict, Tuple, Any, Optional
import numpy as np
import pandas as pd

from .utils import time_ranges_overlap, minutes_to_time_str
from .data_loader import DataLoader


class SchedulingGA:
    """Genetic Algorithm for course scheduling."""
    
    def __init__(
        self,
        data_loader: DataLoader,
        pop_size: int = 50,
        generations: int = 100,
        mutation_rate: float = 0.15,
        crossover_rate: float = 0.8
    ):
        """Initialize the GA scheduler.
        
        Args:
            data_loader: DataLoader instance with prepared data
            pop_size: Population size
            generations: Number of generations to run
            mutation_rate: Probability of mutation
            crossover_rate: Probability of crossover
        """
        self.pop_size = pop_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        
        # Data from loader
        self.data_loader = data_loader
        self.courses_df = data_loader.courses_df
        self.rooms_df = data_loader.rooms_df
        self.doctors_df = data_loader.doctors_df
        self.divisions_df = data_loader.divisions_df
        self.doctor_availability = data_loader.doctor_availability
        self.room_dict = data_loader.room_dict
        
        self.prepare_data()
    
    def prepare_data(self):
        """Prepare internal data structures."""
        self.courses = self.courses_df['Course_ID'].tolist()
        
        # Build course-division pairs (ONE division per course)
        self.divisions = []
        for _, course_row in self.courses_df.iterrows():
            course_id = course_row['Course_ID']
            year = course_row['Year']
            major = course_row['Major']
            dept = course_row['Department']
            
            matching_divs = self.divisions_df[
                (self.divisions_df['Year'] == year) &
                (self.divisions_df['Major'] == major) &
                (self.divisions_df['Department'] == dept)
            ]
            
            if not matching_divs.empty:
                # Pick the first matching division (largest student group)
                best_div = matching_divs.sort_values('StudentNum', ascending=False).iloc[0]
                self.divisions.append((course_id, best_div['Num_ID']))
            else:
                # No matching division found - try matching by Year and Department only
                fallback_divs = self.divisions_df[
                    (self.divisions_df['Year'] == year) &
                    (self.divisions_df['Department'] == dept)
                ]
                if not fallback_divs.empty:
                    best_div = fallback_divs.sort_values('StudentNum', ascending=False).iloc[0]
                    self.divisions.append((course_id, best_div['Num_ID']))
                else:
                    print(f"Warning: No matching division for course {course_id} (Year={year}, Major={major}, Dept={dept})")
        
        # Log expected assignment count
        expected_assignments = 0
        for course_id, div_id in self.divisions:
            course_info = self.courses_df[self.courses_df['Course_ID'] == course_id].iloc[0]
            expected_assignments += int(course_info['Days'])
        print(f"Course-division pairs: {len(self.divisions)}, Expected assignments: {expected_assignments}")
        
        # Get available days
        if len(self.doctors_df) > 0 and 'Day' in self.doctors_df.columns:
            self.days = self.doctors_df['Day'].unique().tolist()
        else:
            self.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday']
        
        self.all_rooms = self.rooms_df['Room_ID'].tolist()
        self.lecture_rooms = self.rooms_df[self.rooms_df['Type'] == 'Lecture']['Room_ID'].tolist()
        self.lab_rooms = self.rooms_df[self.rooms_df['Type'] == 'Lab']['Room_ID'].tolist()
        
        # Pre-compute room splits for oversized groups
        self.session_splits = self._compute_session_splits()
    
    def _compute_session_splits(self) -> Dict:
        """Compute room splits for groups that are too large for any single room.
        
        Returns a dict: (course_id, div_id) -> list of (room_id, student_count) tuples
        """
        splits = {}
        
        # Get capacities sorted by size (largest first)
        lecture_rooms_sorted = sorted(
            [(r, self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0]) 
             for r in self.lecture_rooms],
            key=lambda x: -x[1]
        )
        lab_rooms_sorted = sorted(
            [(r, self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0]) 
             for r in self.lab_rooms],
            key=lambda x: -x[1]
        )
        
        max_lecture_capacity = sum(cap for _, cap in lecture_rooms_sorted)
        max_lab_capacity = sum(cap for _, cap in lab_rooms_sorted)
        
        print(f"\nRoom capacities - Lecture rooms: {lecture_rooms_sorted}, Lab rooms: {lab_rooms_sorted}")
        print(f"Max combined capacity - Lectures: {max_lecture_capacity}, Labs: {max_lab_capacity}")
        
        for course_id, div_id in self.divisions:
            course_info = self.courses_df[self.courses_df['Course_ID'] == course_id].iloc[0]
            div_info = self.divisions_df[self.divisions_df['Num_ID'] == div_id].iloc[0]
            
            # Hybrid Rotation Logic: Only 50% of students need a room
            total_students = int(div_info['StudentNum'])
            student_count = (total_students + 1) // 2
            
            course_type = course_info['Type']
            
            # Get appropriate rooms based on type
            if course_type == 'Lecture':
                rooms_sorted = lecture_rooms_sorted
            else:
                rooms_sorted = lab_rooms_sorted
            
            if not rooms_sorted:
                continue
            
            # Check if largest room can fit everyone
            largest_room, largest_capacity = rooms_sorted[0]
            
            if student_count <= largest_capacity:
                # Single room is enough - no split needed
                continue
            
            # Need to split - find combination of rooms
            remaining_students = student_count
            room_assignments = []
            
            for room_id, capacity in rooms_sorted:
                if remaining_students <= 0:
                    break
                
                # Assign as many students as this room can hold
                students_in_room = min(remaining_students, capacity)
                room_assignments.append((room_id, students_in_room))
                remaining_students -= students_in_room
            
            if remaining_students > 0:
                print(f"WARNING: Cannot fit all {student_count} students for {course_id}/{div_id}. "
                      f"Overflow: {remaining_students} students")
            
            if len(room_assignments) > 1:
                splits[(course_id, div_id)] = room_assignments
                print(f"SPLIT: {course_id}/{div_id} ({student_count} students) -> {room_assignments}")
        
        print(f"\nTotal sessions requiring splits: {len(splits)}")
        return splits
    
    def has_conflict(
        self,
        schedule: List[Dict],
        day: str,
        instructor_id: str,
        time_start: int,
        time_end: int,
        exclude_assignment: Optional[Dict] = None,
        check_room: Optional[str] = None,
        check_division: Optional[str] = None
    ) -> bool:
        """Check if there's a scheduling conflict."""
        for assignment in schedule:
            if exclude_assignment is not None and assignment == exclude_assignment:
                continue
            
            # Instructor conflict
            if (assignment['Instructor_ID'] == instructor_id and 
                assignment['Day'] == day and
                time_ranges_overlap(time_start, time_end, 
                                   assignment['Start_Time'], 
                                   assignment['End_Time'])):
                return True
            
            # Room conflict
            if check_room is not None:
                if (assignment['Room_ID'] == check_room and 
                    assignment['Day'] == day and
                    time_ranges_overlap(time_start, time_end, 
                                       assignment['Start_Time'], 
                                       assignment['End_Time'])):
                    return True
            
            # Division conflict
            if check_division is not None:
                if (assignment['Group_ID'] == check_division and 
                    assignment['Day'] == day and
                    time_ranges_overlap(time_start, time_end, 
                                       assignment['Start_Time'], 
                                       assignment['End_Time'])):
                    return True
        
        return False
    
    def create_individual(self) -> List[Dict]:
        """Create a random individual (schedule).
        
        GUARANTEES exactly the expected number of assignments.
        Every course-division pair gets exactly 'days_needed' assignments.
        If no conflict-free slot is found, a random slot is force-assigned
        (the fitness function will penalize conflicts and the GA will evolve).
        
        For oversized groups that don't fit in any single room, we create
        multiple parallel sessions in different rooms at the same time.
        """
        schedule = []
        default_times = [8 * 60, 9 * 60, 10 * 60, 11 * 60, 12 * 60, 13 * 60, 14 * 60, 15 * 60, 16 * 60]
        
        for course_id, div_id in self.divisions:
            course_info = self.courses_df[self.courses_df['Course_ID'] == course_id].iloc[0]
            div_info = self.divisions_df[self.divisions_df['Num_ID'] == div_id].iloc[0]
            
            instructor_id = course_info['Instructor_ID']
            course_type = course_info['Type']
            days_needed = int(course_info['Days'])
            hours_per_day = int(course_info['Hours_per_day'])
            duration_minutes = hours_per_day * 60
            
            # Check if this course-division pair needs to be split
            split_key = (course_id, div_id)
            is_split = split_key in self.session_splits
            
            # Get appropriate rooms - STRICTLY enforce capacity
            # Hybrid Rotation Logic: Only 50% of students need a room
            total_div_students = int(div_info['StudentNum'])
            student_count = (total_div_students + 1) // 2
            
            if is_split:
                # For split sessions, use the pre-computed room assignments
                split_rooms = [room_id for room_id, _ in self.session_splits[split_key]]
                available_rooms = split_rooms
            elif course_type == 'Lecture':
                # Get all lecture rooms that can fit the students
                available_rooms = [r for r in self.lecture_rooms 
                             if self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0] >= student_count]
                # Sort by capacity (prefer smallest adequate room to save large rooms for large classes)
                available_rooms.sort(key=lambda r: self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0])
                
                # If no room fits, we MUST use the largest available room even if it's too small
                if not available_rooms:
                    print(f"WARNING: No lecture room fits {student_count} students for {course_id}. Using largest available.")
                    available_rooms = sorted(self.lecture_rooms, 
                                           key=lambda r: self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0],
                                           reverse=True)
            else:
                # Lab - same logic
                available_rooms = [r for r in self.lab_rooms 
                                  if self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0] >= student_count]
                available_rooms.sort(key=lambda r: self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0])
                
                if not available_rooms:
                    print(f"WARNING: No lab room fits {student_count} students for {course_id}. Using largest available.")
                    available_rooms = sorted(self.lab_rooms,
                                           key=lambda r: self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0],
                                           reverse=True)
            
            # Absolute fallback
            if not available_rooms:
                available_rooms = sorted(self.all_rooms,
                                        key=lambda r: self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0],
                                        reverse=True)
            
            # Get available days for instructor
            available_days = [d for d in self.days 
                             if instructor_id in self.doctor_availability and d in self.doctor_availability[instructor_id]]
            
            if not available_days:
                available_days = self.days.copy()
            
            # Select days for scheduling - ensure we always have enough days
            all_days_pool = self.days.copy()
            if len(available_days) >= days_needed:
                scheduled_days = random.sample(available_days, days_needed)
            else:
                scheduled_days = available_days.copy()
                remaining = days_needed - len(scheduled_days)
                other_days = [d for d in all_days_pool if d not in scheduled_days]
                if remaining > 0:
                    # If still not enough, repeat days
                    if len(other_days) >= remaining:
                        scheduled_days.extend(random.sample(other_days, remaining))
                    else:
                        scheduled_days.extend(other_days)
                        # If we STILL need more, just repeat from all days
                        still_remaining = days_needed - len(scheduled_days)
                        for _ in range(still_remaining):
                            scheduled_days.append(random.choice(all_days_pool))
            
            for day_idx in range(days_needed):
                day = scheduled_days[day_idx] if day_idx < len(scheduled_days) else random.choice(all_days_pool)
                
                placed = False
                
                # Strategy 1: Try instructor availability slots (conflict-free)
                if instructor_id in self.doctor_availability and day in self.doctor_availability[instructor_id]:
                    suitable_slots = []
                    for doc_start, doc_end in self.doctor_availability[instructor_id][day]:
                        available_duration = doc_end - doc_start
                        if available_duration < 0:
                            available_duration = (24 * 60) - doc_start + doc_end
                        if available_duration >= duration_minutes:
                            suitable_slots.append((doc_start, doc_end))
                    
                    if suitable_slots:
                        random.shuffle(suitable_slots)
                        for doc_start, doc_end in suitable_slots:
                            lecture_end = doc_start + duration_minutes
                            if lecture_end <= doc_end:
                                if is_split:
                                    # For split sessions, create parallel assignments in all rooms
                                    all_rooms_available = True
                                    for room in available_rooms:
                                        if self.has_conflict(schedule, day, instructor_id, doc_start, lecture_end,
                                                             check_room=room, check_division=div_id):
                                            all_rooms_available = False
                                            break
                                    
                                    if all_rooms_available:
                                        # Create parallel sessions in all split rooms
                                        for room_id, students_in_room in self.session_splits[split_key]:
                                            schedule.append({
                                                'Day': day,
                                                'Course_ID': course_id,
                                                'Instructor_ID': instructor_id,
                                                'Group_ID': div_id,
                                                'Room_ID': room_id,
                                                'Time_Slot': f"{day}_{doc_start}_{lecture_end}",
                                                'Start_Time': doc_start,
                                                'End_Time': lecture_end,
                                                'Duration': duration_minutes,
                                                'Students': students_in_room,
                                                'Is_Split': True
                                            })
                                        placed = True
                                        break
                                else:
                                    # Normal single-room assignment
                                    shuffled_rooms = available_rooms.copy()
                                    random.shuffle(shuffled_rooms)
                                    for room in shuffled_rooms:
                                        if not self.has_conflict(schedule, day, instructor_id, doc_start, lecture_end,
                                                                 check_room=room, check_division=div_id):
                                            schedule.append({
                                                'Day': day,
                                                'Course_ID': course_id,
                                                'Instructor_ID': instructor_id,
                                                'Group_ID': div_id,
                                                'Room_ID': room,
                                                'Time_Slot': f"{day}_{doc_start}_{lecture_end}",
                                                'Start_Time': doc_start,
                                                'End_Time': lecture_end,
                                                'Duration': duration_minutes
                                            })
                                            placed = True
                                            break
                                    if placed:
                                        break
                
                # Strategy 2: Try default time slots (conflict-free)
                if not placed:
                    shuffled_times = default_times.copy()
                    random.shuffle(shuffled_times)
                    
                    for start_time in shuffled_times:
                        end_time = start_time + duration_minutes
                        
                        if is_split:
                            # Check all rooms for splits
                            all_rooms_available = True
                            for room in available_rooms:
                                if self.has_conflict(schedule, day, instructor_id, start_time, end_time,
                                                     check_room=room, check_division=div_id):
                                    all_rooms_available = False
                                    break
                            
                            if all_rooms_available:
                                for room_id, students_in_room in self.session_splits[split_key]:
                                    schedule.append({
                                        'Day': day,
                                        'Course_ID': course_id,
                                        'Instructor_ID': instructor_id,
                                        'Group_ID': div_id,
                                        'Room_ID': room_id,
                                        'Time_Slot': f"{day}_{start_time}_{end_time}",
                                        'Start_Time': start_time,
                                        'End_Time': end_time,
                                        'Duration': duration_minutes,
                                        'Students': students_in_room,
                                        'Is_Split': True
                                    })
                                placed = True
                                break
                        else:
                            shuffled_rooms = available_rooms.copy()
                            random.shuffle(shuffled_rooms)
                            for room in shuffled_rooms:
                                if not self.has_conflict(schedule, day, instructor_id, start_time, end_time,
                                                         check_room=room, check_division=div_id):
                                    schedule.append({
                                        'Day': day,
                                        'Course_ID': course_id,
                                        'Instructor_ID': instructor_id,
                                        'Group_ID': div_id,
                                        'Room_ID': room,
                                        'Time_Slot': f"{day}_{start_time}_{end_time}",
                                        'Start_Time': start_time,
                                        'End_Time': end_time,
                                        'Duration': duration_minutes
                                    })
                                    placed = True
                                    break
                            if placed:
                                break
                
                # Strategy 3: FORCE placement with random time/room (allows conflicts)
                # The fitness function will penalize, and GA will evolve better solutions
                if not placed:
                    start_time = random.choice(default_times)
                    end_time = start_time + duration_minutes
                    
                    if is_split:
                        for room_id, students_in_room in self.session_splits[split_key]:
                            schedule.append({
                                'Day': day,
                                'Course_ID': course_id,
                                'Instructor_ID': instructor_id,
                                'Group_ID': div_id,
                                'Room_ID': room_id,
                                'Time_Slot': f"{day}_{start_time}_{end_time}",
                                'Start_Time': start_time,
                                'End_Time': end_time,
                                'Duration': duration_minutes,
                                'Students': students_in_room,
                                'Is_Split': True
                            })
                    else:
                        room = random.choice(available_rooms)
                        schedule.append({
                            'Day': day,
                            'Course_ID': course_id,
                            'Instructor_ID': instructor_id,
                            'Group_ID': div_id,
                            'Room_ID': room,
                            'Time_Slot': f"{day}_{start_time}_{end_time}",
                            'Start_Time': start_time,
                            'End_Time': end_time,
                            'Duration': duration_minutes
                        })
        
        return schedule
    
    def fitness(self, individual: List[Dict]) -> float:
        """Calculate fitness score (lower is better)."""
        violations = 0
        penalty = 0
        
        for assignment in individual:
            room = assignment['Room_ID']
            day = assignment['Day']
            instructor = assignment['Instructor_ID']
            division = assignment['Group_ID']
            time_start = assignment['Start_Time']
            time_end = assignment['End_Time']
            course_id = assignment['Course_ID']
            
            course_info = self.courses_df[self.courses_df['Course_ID'] == course_id].iloc[0]
            required_hours = int(course_info['Hours_per_day'])
            required_duration_minutes = required_hours * 60
            
            actual_duration = time_end - time_start
            if actual_duration < 0:
                actual_duration = (24 * 60) - time_start + time_end
            
            # Duration mismatch
            if abs(actual_duration - required_duration_minutes) > 5:
                violations += 10
                penalty += 100
            
            # Capacity violation - CRITICAL: students MUST fit in room
            room_capacity = self.rooms_df[self.rooms_df['Room_ID'] == room]['Capacity'].iloc[0]
            div_students = self.divisions_df[self.divisions_df['Num_ID'] == division]['StudentNum'].iloc[0]
            if room_capacity < div_students:
                overflow = div_students - room_capacity
                # Heavy penalty based on overflow amount
                violations += 100 + overflow
                penalty += 1000 + overflow * 10
            
            # Room type mismatch
            room_type = self.rooms_df[self.rooms_df['Room_ID'] == room]['Type'].iloc[0]
            course_type = course_info['Type']
            if room_type != course_type:
                violations += 10
                penalty += 100
            
            # Instructor availability
            if instructor in self.doctor_availability and day in self.doctor_availability[instructor]:
                available = False
                for doc_start, doc_end in self.doctor_availability[instructor][day]:
                    if doc_start <= doc_end:
                        if time_start >= doc_start and time_end <= doc_end:
                            available = True
                            break
                    else:
                        if time_start >= doc_start or time_end <= doc_end:
                            available = True
                            break
                
                if not available:
                    violations += 5
                    penalty += 50
            
            # Room conflicts
            for other_assignment in individual:
                if other_assignment == assignment:
                    continue
                if (other_assignment['Room_ID'] == room and 
                    other_assignment['Day'] == day and
                    time_ranges_overlap(time_start, time_end, 
                                       other_assignment['Start_Time'], 
                                       other_assignment['End_Time'])):
                    violations += 100
                    penalty += 1000
                    break
            
            # Instructor conflicts
            for other_assignment in individual:
                if other_assignment == assignment:
                    continue
                if (other_assignment['Instructor_ID'] == instructor and 
                    other_assignment['Day'] == day and
                    time_ranges_overlap(time_start, time_end, 
                                       other_assignment['Start_Time'], 
                                       other_assignment['End_Time'])):
                    violations += 100
                    penalty += 1000
                    break
            
            # Division conflicts
            for other_assignment in individual:
                if other_assignment == assignment:
                    continue
                if (other_assignment['Group_ID'] == division and 
                    other_assignment['Day'] == day and
                    time_ranges_overlap(time_start, time_end, 
                                       other_assignment['Start_Time'], 
                                       other_assignment['End_Time'])):
                    violations += 100
                    penalty += 1000
                    break
        
        # Missing course-division pairs
        scheduled_pairs = set()
        course_days_count = {}
        for assignment in individual:
            course_id = assignment['Course_ID']
            div_id = assignment['Group_ID']
            scheduled_pairs.add((course_id, div_id))
            if course_id not in course_days_count:
                course_days_count[course_id] = set()
            course_days_count[course_id].add(assignment['Day'])
        
        for course_id, div_id in self.divisions:
            if (course_id, div_id) not in scheduled_pairs:
                violations += 50
                penalty += 500
        
        # Missing days for courses
        for course_id in self.courses:
            required_days = int(self.courses_df[self.courses_df['Course_ID'] == course_id]['Days'].iloc[0])
            if course_id not in course_days_count or len(course_days_count[course_id]) < required_days:
                missing_days = required_days - (len(course_days_count[course_id]) if course_id in course_days_count else 0)
                violations += 50 * missing_days
                penalty += 500 * missing_days
        
        # Penalty for room clustering on same day (to distribute load)
        # Discourage scheduling too many sessions in the same room on the same day
        room_day_usage = {}
        for assignment in individual:
            room = assignment['Room_ID']
            day = assignment['Day']
            key = (room, day)
            if key not in room_day_usage:
                room_day_usage[key] = 0
            room_day_usage[key] += 1
        
        # Apply strong penalty for excessive clustering (more than 4 sessions per room per day)
        # This forces better distribution across rooms and days
        for (room, day), count in room_day_usage.items():
            if count > 4:
                excess = count - 4
                # Quadratic penalty for excessive clustering - gets much worse as overloading increases
                violations += 100 * excess * excess
                penalty += 1000 * excess * excess
        
        return violations + penalty / 1000
    
    def crossover(self, parent1: List[Dict], parent2: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Perform crossover between two parents.
        
        Guarantees both children have assignments for ALL required course-division pairs.
        For each pair, the child inherits ALL day-assignments from the chosen parent.
        """
        if random.random() > self.crossover_rate:
            return copy.deepcopy(parent1), copy.deepcopy(parent2)
        
        child1 = []
        child2 = []
        
        # Group assignments by (Course_ID, Group_ID) - preserving ALL assignments per pair (multi-day)
        from collections import defaultdict
        p1_assignments = defaultdict(list)
        p2_assignments = defaultdict(list)
        
        for a in parent1:
            p1_assignments[(a['Course_ID'], a['Group_ID'])].append(a)
        for a in parent2:
            p2_assignments[(a['Course_ID'], a['Group_ID'])].append(a)
        
        # Use self.divisions as the canonical set of pairs to ensure nothing is lost
        all_pairs = list(set(
            list(self.divisions) + 
            list(p1_assignments.keys()) + 
            list(p2_assignments.keys())
        ))
        random.shuffle(all_pairs)
        split_point = len(all_pairs) // 2
        
        for i, pair in enumerate(all_pairs):
            p1_has = pair in p1_assignments and len(p1_assignments[pair]) > 0
            p2_has = pair in p2_assignments and len(p2_assignments[pair]) > 0
            
            if i < split_point:
                # child1 gets from parent1, child2 gets from parent2
                if p1_has:
                    child1.extend([copy.deepcopy(a) for a in p1_assignments[pair]])
                elif p2_has:
                    child1.extend([copy.deepcopy(a) for a in p2_assignments[pair]])
                    
                if p2_has:
                    child2.extend([copy.deepcopy(a) for a in p2_assignments[pair]])
                elif p1_has:
                    child2.extend([copy.deepcopy(a) for a in p1_assignments[pair]])
            else:
                # child1 gets from parent2, child2 gets from parent1
                if p2_has:
                    child1.extend([copy.deepcopy(a) for a in p2_assignments[pair]])
                elif p1_has:
                    child1.extend([copy.deepcopy(a) for a in p1_assignments[pair]])
                    
                if p1_has:
                    child2.extend([copy.deepcopy(a) for a in p1_assignments[pair]])
                elif p2_has:
                    child2.extend([copy.deepcopy(a) for a in p2_assignments[pair]])
        
        return child1, child2
    
    def mutate(self, individual: List[Dict]) -> List[Dict]:
        """Apply mutation to an individual."""
        if random.random() > self.mutation_rate:
            return individual
        
        mutated = [copy.deepcopy(a) for a in individual]
        
        if len(mutated) == 0:
            return mutated
        
        mutation_type = random.choice(['change_room', 'change_time'])
        
        idx = random.randint(0, len(mutated) - 1)
        assignment = mutated[idx]
        
        # Skip mutation for split sessions to avoid desynchronization
        if assignment.get('Is_Split'):
            return mutated
            
        if mutation_type == 'change_room':
            course_id = assignment['Course_ID']
            div_id = assignment['Group_ID']
            
            course_info = self.courses_df[self.courses_df['Course_ID'] == course_id].iloc[0]
            div_info = self.divisions_df[self.divisions_df['Num_ID'] == div_id].iloc[0]
            
            if course_info['Type'] == 'Lecture':
                available_rooms = [r for r in self.lecture_rooms 
                                if self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0] >= div_info['StudentNum']]
            else:
                available_rooms = [r for r in self.lab_rooms 
                                if self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0] >= div_info['StudentNum']]
            
            if available_rooms:
                assignment['Room_ID'] = random.choice(available_rooms)
        
        elif mutation_type == 'change_time':
            idx = random.randint(0, len(mutated) - 1)
            assignment = mutated[idx]
            course_id = assignment['Course_ID']
            instructor_id = assignment['Instructor_ID']
            div_id = assignment['Group_ID']
            day = assignment['Day']
            duration = assignment['Duration']
            
            # Try a new random time slot
            default_times = [8 * 60, 9 * 60, 10 * 60, 11 * 60, 12 * 60, 13 * 60, 14 * 60, 15 * 60, 16 * 60]
            random.shuffle(default_times)
            
            for new_start in default_times:
                new_end = new_start + duration
                if not self.has_conflict(mutated, day, instructor_id, new_start, new_end,
                                        exclude_assignment=assignment,
                                        check_room=assignment['Room_ID'],
                                        check_division=div_id):
                    assignment['Start_Time'] = new_start
                    assignment['End_Time'] = new_end
                    assignment['Time_Slot'] = f"{day}_{new_start}_{new_end}"
                    break
        
        return mutated
    
    def select_parents(self, population: List[List[Dict]], fitness_scores: List[float]) -> Tuple[List[Dict], List[Dict]]:
        """Select parents using tournament selection."""
        tournament_size = 3
        parent1 = min(random.sample(range(len(population)), tournament_size), 
                     key=lambda i: fitness_scores[i])
        parent2 = min(random.sample(range(len(population)), tournament_size), 
                     key=lambda i: fitness_scores[i])
        return population[parent1], population[parent2]
    
    def run(self) -> Tuple[List[Dict], List[float]]:
        """Run the genetic algorithm.
        
        Returns:
            Tuple of (best_schedule, fitness_history)
        """
        print("Initializing population...")
        population = [self.create_individual() for _ in range(self.pop_size)]
        
        best_fitness_history = []
        
        for generation in range(self.generations):
            fitness_scores = [self.fitness(ind) for ind in population]
            best_idx = min(range(len(population)), key=lambda i: fitness_scores[i])
            best_fitness = fitness_scores[best_idx]
            best_fitness_history.append(best_fitness)
            
            if generation % 10 == 0:
                print(f"Generation {generation}: Best fitness = {best_fitness:.2f}, "
                      f"Avg fitness = {np.mean(fitness_scores):.2f}, "
                      f"Best schedule has {len(population[best_idx])} assignments")
            
            new_population = []
            
            # Elitism
            new_population.append(copy.deepcopy(population[best_idx]))
            
            while len(new_population) < self.pop_size:
                parent1, parent2 = self.select_parents(population, fitness_scores)
                child1, child2 = self.crossover(parent1, parent2)
                child1 = self.mutate(child1)
                child2 = self.mutate(child2)
                new_population.extend([child1, child2])
            
            population = new_population[:self.pop_size]
        
        final_fitness = [self.fitness(ind) for ind in population]
        best_idx = min(range(len(population)), key=lambda i: final_fitness[i])
        
        print(f"\nFinal best fitness: {final_fitness[best_idx]:.2f}")
        print(f"Best schedule has {len(population[best_idx])} assignments")
        
        # Verify assignment count matches expected
        expected = sum(
            int(self.courses_df[self.courses_df['Course_ID'] == cid].iloc[0]['Days'])
            for cid, _ in self.divisions
        )
        actual = len(population[best_idx])
        if actual != expected:
            print(f"[WARNING] Assignment count mismatch: expected {expected}, got {actual}")
        else:
            print(f"[OK] Assignment count matches expected: {actual}")
        
        # Check for conflicts in the best schedule
        best_schedule = population[best_idx]
        room_conflicts = []
        instructor_conflicts = []
        division_conflicts = []
        
        for i, assignment in enumerate(best_schedule):
            for j, other in enumerate(best_schedule):
                if i >= j:
                    continue
                
                if assignment['Day'] != other['Day']:
                    continue
                
                if not time_ranges_overlap(assignment['Start_Time'], assignment['End_Time'],
                                          other['Start_Time'], other['End_Time']):
                    continue
                
                # Room conflict
                if assignment['Room_ID'] == other['Room_ID']:
                    room_conflicts.append((assignment, other))
                
                # Instructor conflict
                if assignment['Instructor_ID'] == other['Instructor_ID']:
                    instructor_conflicts.append((assignment, other))
                
                # Division conflict
                if assignment['Group_ID'] == other['Group_ID']:
                    division_conflicts.append((assignment, other))
        
        if room_conflicts or instructor_conflicts or division_conflicts:
            print(f"\n[WARNING] Conflicts detected in final schedule:")
            print(f"  - Room conflicts: {len(room_conflicts)}")
            print(f"  - Instructor conflicts: {len(instructor_conflicts)}")
            print(f"  - Division conflicts: {len(division_conflicts)}")
            
            if room_conflicts:
                print("\n  Room conflict details:")
                for a1, a2 in room_conflicts[:3]:  # Show first 3
                    print(f"    {a1['Room_ID']} on {a1['Day']}: {a1['Course_ID']} vs {a2['Course_ID']}")
            
            # Attempt to resolve room conflicts
            print("\n  Attempting to resolve room conflicts...")
            resolved_count = 0
            
            # Process all conflicts - we need to resolve each one if possible
            for a1, a2 in room_conflicts:
                # Skip split sessions - moving one part would desynchronize the class
                if a1.get('Is_Split') or a2.get('Is_Split'):
                    continue
                
                # Check if this conflict still exists (may have been resolved by previous fix)
                if a1['Room_ID'] != a2['Room_ID'] or a1['Day'] != a2['Day']:
                    continue
                if not time_ranges_overlap(a1['Start_Time'], a1['End_Time'], 
                                          a2['Start_Time'], a2['End_Time']):
                    continue
                
                # Try to move the smaller class to a different room
                smaller = a1 if a1.get('Students', 0) <= a2.get('Students', 0) else a2
                
                # Double check smaller isn't split
                if smaller.get('Is_Split'):
                    continue
                    
                student_count = smaller.get('Students', 0)
                
                # Get the course type to determine which rooms to use
                course_info = self.data_loader.course_dict.get(smaller['Course_ID'], {})
                course_type = course_info.get('type', 'Lecture')
                
                # Use only appropriate room type (Lecture rooms for lectures, Lab rooms for labs)
                if course_type == 'Lab':
                    available_rooms = self.data_loader.lab_rooms.copy()
                else:
                    available_rooms = self.data_loader.lecture_rooms.copy()
                
                # Sort rooms by capacity (prefer rooms that fit best)
                available_rooms.sort(key=lambda r: abs(self.room_dict.get(r, {}).get('capacity', 0) - student_count))
                
                # Try each alternative room
                moved = False
                for alt_room in available_rooms:
                    if alt_room == smaller['Room_ID']:
                        continue
                        
                    # Check if this room is free at this time
                    conflict_found = False
                    for other in best_schedule:
                        if other == smaller:
                            continue
                        if (other['Room_ID'] == alt_room and 
                            other['Day'] == smaller['Day'] and
                            time_ranges_overlap(smaller['Start_Time'], smaller['End_Time'],
                                               other['Start_Time'], other['End_Time'])):
                            conflict_found = True
                            break
                    
                    if not conflict_found:
                        # Check room capacity (Strict check - NO overflow allowed)
                        room_capacity = self.room_dict.get(alt_room, {}).get('capacity', 0)
                        if room_capacity >= student_count:
                            old_room = smaller['Room_ID']
                            smaller['Room_ID'] = alt_room
                            print(f"    Moved {smaller['Course_ID']} from {old_room} to {alt_room}")
                            resolved_count += 1
                            moved = True
                            break
                
                # If couldn't move to different room, try moving to different day
                if not moved:
                    days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
                    current_day = smaller['Day']
                    
                    for alt_day in days:
                        if alt_day == current_day:
                            continue
                        
                        # Check if this day/time/room combo is free
                        conflict_found = False
                        for other in best_schedule:
                            if other == smaller:
                                continue
                            # Check all three conflict types
                            if other['Day'] != alt_day:
                                continue
                            if not time_ranges_overlap(smaller['Start_Time'], smaller['End_Time'],
                                                       other['Start_Time'], other['End_Time']):
                                continue
                            # Room conflict
                            if other['Room_ID'] == smaller['Room_ID']:
                                conflict_found = True
                                break
                            # Instructor conflict
                            if other['Instructor_ID'] == smaller['Instructor_ID']:
                                conflict_found = True
                                break
                            # Division conflict
                            if other['Group_ID'] == smaller['Group_ID']:
                                conflict_found = True
                                break
                        
                        if not conflict_found:
                            old_day = smaller['Day']
                            smaller['Day'] = alt_day
                            print(f"    Moved {smaller['Course_ID']} from {old_day} to {alt_day}")
                            resolved_count += 1
                            break
            
            if resolved_count > 0:
                print(f"\n  [OK] Resolved {resolved_count} room conflict(s) by moving to different rooms")
            
            # Re-check for remaining conflicts
            remaining_conflicts = []
            for i, assignment in enumerate(best_schedule):
                for j, other in enumerate(best_schedule):
                    if i >= j:
                        continue
                    if (assignment['Room_ID'] == other['Room_ID'] and 
                        assignment['Day'] == other['Day'] and
                        time_ranges_overlap(assignment['Start_Time'], assignment['End_Time'],
                                           other['Start_Time'], other['End_Time'])):
                        remaining_conflicts.append((assignment, other))
            
            # Try to resolve remaining conflicts by shifting time
            if remaining_conflicts:
                print(f"\n  Attempting to resolve {len(remaining_conflicts)} remaining conflict(s) by shifting time...")
                time_resolved = 0
                time_slots = [480, 540, 600, 660, 720, 780, 840, 900, 960, 1020]  # 8AM to 5PM in 60-min slots
                
                for a1, a2 in remaining_conflicts:
                    # Try to move the smaller class to a different time
                    smaller = a1 if a1.get('Students', 0) <= a2.get('Students', 0) else a2
                    duration = smaller['End_Time'] - smaller['Start_Time']
                    
                    for new_start in time_slots:
                        if new_start == smaller['Start_Time']:
                            continue
                        new_end = new_start + duration
                        
                        # Check if this time slot is conflict-free
                        conflict_found = False
                        for other in best_schedule:
                            if other == smaller:
                                continue
                            # Check room conflict at new time
                            if (other['Room_ID'] == smaller['Room_ID'] and 
                                other['Day'] == smaller['Day'] and
                                time_ranges_overlap(new_start, new_end,
                                                   other['Start_Time'], other['End_Time'])):
                                conflict_found = True
                                break
                            # Check instructor conflict at new time
                            if (other['Instructor_ID'] == smaller['Instructor_ID'] and 
                                other['Day'] == smaller['Day'] and
                                time_ranges_overlap(new_start, new_end,
                                                   other['Start_Time'], other['End_Time'])):
                                conflict_found = True
                                break
                            # Check division conflict at new time
                            if (other['Group_ID'] == smaller['Group_ID'] and 
                                other['Day'] == smaller['Day'] and
                                time_ranges_overlap(new_start, new_end,
                                                   other['Start_Time'], other['End_Time'])):
                                conflict_found = True
                                break
                        
                        if not conflict_found:
                            old_time = f"{smaller['Start_Time']//60}:{smaller['Start_Time']%60:02d}"
                            new_time = f"{new_start//60}:{new_start%60:02d}"
                            smaller['Start_Time'] = new_start
                            smaller['End_Time'] = new_end
                            print(f"    Moved {smaller['Course_ID']} from {old_time} to {new_time}")
                            time_resolved += 1
                            break
                
                if time_resolved > 0:
                    print(f"\n  [OK] Resolved {time_resolved} additional conflict(s) by shifting time")
                else:
                    # Last resort: try moving to a different day entirely
                    print("\n  Attempting to move conflicts to different days...")
                    days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
                    day_resolved = 0
                    
                    for a1, a2 in remaining_conflicts:
                        # Check if this conflict still exists
                        if a1['Room_ID'] != a2['Room_ID'] or a1['Day'] != a2['Day']:
                            continue
                        if not time_ranges_overlap(a1['Start_Time'], a1['End_Time'],
                                                  a2['Start_Time'], a2['End_Time']):
                            continue
                        
                        smaller = a1 if a1.get('Students', 0) <= a2.get('Students', 0) else a2
                        
                        for alt_day in days:
                            if alt_day == smaller['Day']:
                                continue
                            
                            # Check if moving to this day causes any conflicts
                            conflict_found = False
                            for other in best_schedule:
                                if other == smaller:
                                    continue
                                if other['Day'] != alt_day:
                                    continue
                                if not time_ranges_overlap(smaller['Start_Time'], smaller['End_Time'],
                                                          other['Start_Time'], other['End_Time']):
                                    continue
                                
                                # Room conflict
                                if other['Room_ID'] == smaller['Room_ID']:
                                    conflict_found = True
                                    break
                                # Instructor conflict
                                if other['Instructor_ID'] == smaller['Instructor_ID']:
                                    conflict_found = True
                                    break
                                # Division conflict  
                                if other['Group_ID'] == smaller['Group_ID']:
                                    conflict_found = True
                                    break
                            
                            if not conflict_found:
                                old_day = smaller['Day']
                                smaller['Day'] = alt_day
                                print(f"    Moved {smaller['Course_ID']} from {old_day} to {alt_day}")
                                day_resolved += 1
                                break
                    
                    if day_resolved > 0:
                        print(f"\n  [OK] Resolved {day_resolved} conflict(s) by moving to different days")
                    else:
                        print("\n  [WARNING] Could not resolve remaining conflicts - schedule may have issues")
        else:
            print("\n[OK] No conflicts detected in final schedule!")
        
        return population[best_idx], best_fitness_history
    
    def format_schedule(self, schedule: List[Dict]) -> List[Dict]:
        """Format the schedule for output."""
        formatted = []
        
        for assignment in schedule:
            try:
                course_id = assignment['Course_ID']
                instructor_id = assignment['Instructor_ID']
                group_id = assignment['Group_ID']
                room_id = assignment['Room_ID']
                day = assignment['Day']
                
                course_match = self.courses_df[self.courses_df['Course_ID'] == course_id]
                if course_match.empty:
                    print(f"Warning: Course {course_id} not found in courses_df")
                    continue
                course_info = course_match.iloc[0]
                
                instructor_match = self.doctors_df[self.doctors_df['Instructor_ID'] == instructor_id]
                if instructor_match.empty:
                    instructor_name = f"Unknown ({instructor_id})"
                    print(f"Warning: Instructor {instructor_id} not found in doctors_df")
                else:
                    instructor_info = instructor_match.iloc[0]
                    instructor_name = instructor_info.get('Instructor_Name', f"Unknown ({instructor_id})")
                
                division_match = self.divisions_df[self.divisions_df['Num_ID'] == group_id]
                if division_match.empty:
                    print(f"Warning: Division {group_id} not found in divisions_df")
                    continue
                division_info = division_match.iloc[0]
                
                room_match = self.rooms_df[self.rooms_df['Room_ID'] == room_id]
                if room_match.empty:
                    print(f"Warning: Room {room_id} not found in rooms_df")
                    continue
                room_info = room_match.iloc[0]
                
                start_time_min = assignment.get('Start_Time', 0)
                end_time_min = assignment.get('End_Time', 0)
                
                start_time_str = minutes_to_time_str(start_time_min)
                end_time_str = minutes_to_time_str(end_time_min)
                
                # Use actual assigned students if available (for split sessions), otherwise total division size
                student_count = assignment.get('Students', int(division_info.get('StudentNum', 0)))

                # Hybrid Rotation Logic:
                # We assume the division is split into Group A and Group B.
                # Only 50% attend offline (on-campus) at any time.
                total_students = int(division_info.get('StudentNum', 0))
                offline_students = (total_students + 1) // 2  # Ceiling division
                
                # Format group name to indicate alternation
                group_name = f"{group_id} (Group A/B)"
                
                # Append to course name for backend visibility
                group_suffix = f" ({group_name})"
                course_name_with_group = course_info.get('Course_Name', course_id) + group_suffix

                formatted.append({
                    'day': day,
                    'course_name': course_name_with_group, # Use extended name
                    'instructor_name': instructor_name,
                    'students': offline_students, # Use offline count for DB capacity checks
                    'total_students': total_students, # Keep total for reference
                    'room': room_info.get('Room', room_id),
                    'room_capacity': int(room_info.get('Capacity', 0)),
                    'group': group_name, # Frontend might use this if available
                    'start_time': start_time_str,
                    'end_time': end_time_str,
                    'department': course_info.get('Department', ''),
                    'major': course_info.get('Major', ''),
                    'year': int(course_info.get('Year', 0))
                })
            except Exception as e:
                print(f"Error formatting assignment {assignment}: {e}")
                continue
        
        return formatted

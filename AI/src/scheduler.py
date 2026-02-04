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
        
        # Build course-division pairs
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
            ]['Num_ID'].tolist()
            
            for div_id in matching_divs:
                self.divisions.append((course_id, div_id))
        
        # Get available days
        if len(self.doctors_df) > 0 and 'Day' in self.doctors_df.columns:
            self.days = self.doctors_df['Day'].unique().tolist()
        else:
            self.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday']
        
        self.all_rooms = self.rooms_df['Room_ID'].tolist()
        self.lecture_rooms = self.rooms_df[self.rooms_df['Type'] == 'Lecture']['Room_ID'].tolist()
        self.lab_rooms = self.rooms_df[self.rooms_df['Type'] == 'Lab']['Room_ID'].tolist()
    
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
        """Create a random individual (schedule)."""
        schedule = []
        
        for course_id, div_id in self.divisions:
            course_info = self.courses_df[self.courses_df['Course_ID'] == course_id].iloc[0]
            div_info = self.divisions_df[self.divisions_df['Num_ID'] == div_id].iloc[0]
            
            instructor_id = course_info['Instructor_ID']
            course_type = course_info['Type']
            days_needed = int(course_info['Days'])
            hours_per_day = int(course_info['Hours_per_day'])
            duration_minutes = hours_per_day * 60
            
            # Get appropriate rooms
            if course_type == 'Lecture':
                available_rooms = [r for r in self.lecture_rooms 
                             if self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0] >= div_info['StudentNum']]
                if not available_rooms:
                    available_rooms = self.lecture_rooms
                    available_rooms = sorted(available_rooms, 
                                            key=lambda r: self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0], 
                                            reverse=True)
            else:
                available_rooms = [r for r in self.lab_rooms 
                                  if self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0] >= div_info['StudentNum']]
                if not available_rooms:
                    available_rooms = self.lab_rooms
                    available_rooms = sorted(available_rooms, 
                                            key=lambda r: self.rooms_df[self.rooms_df['Room_ID'] == r]['Capacity'].iloc[0], 
                                            reverse=True)
            
            if not available_rooms:
                continue
            
            # Get available days for instructor
            available_days = [d for d in self.days 
                             if instructor_id in self.doctor_availability and d in self.doctor_availability[instructor_id]]
            
            if not available_days:
                available_days = self.days.copy()
            
            # Select days for scheduling
            if len(available_days) < days_needed:
                scheduled_days = available_days.copy()
                remaining_days_needed = days_needed - len(scheduled_days)
                other_days = [d for d in self.days if d not in scheduled_days]
                if remaining_days_needed > 0 and len(other_days) > 0:
                    scheduled_days.extend(random.sample(other_days, min(remaining_days_needed, len(other_days))))
            else:
                scheduled_days = random.sample(available_days, days_needed)
            
            days_scheduled_count = 0
            
            for day in scheduled_days:
                if days_scheduled_count >= days_needed:
                    break
                
                scheduled_this_day = False
                
                # Try to schedule within instructor availability
                if instructor_id in self.doctor_availability and day in self.doctor_availability[instructor_id]:
                    suitable_slots = []
                    for doc_start, doc_end in self.doctor_availability[instructor_id][day]:
                        available_duration = doc_end - doc_start
                        if available_duration < 0:
                            available_duration = (24 * 60) - doc_start + doc_end
                        
                        if available_duration >= duration_minutes:
                            suitable_slots.append((doc_start, doc_end))
                    
                    if suitable_slots:
                        doc_start, doc_end = random.choice(suitable_slots)
                        lecture_end = doc_start + duration_minutes
                        lecture_end_normalized = lecture_end % (24 * 60) if lecture_end >= 24 * 60 else lecture_end
                        
                        fits_in_availability = False
                        if doc_start <= doc_end:
                            fits_in_availability = (lecture_end_normalized <= doc_end)
                        else:
                            if lecture_end < 24 * 60:
                                fits_in_availability = True
                            else:
                                fits_in_availability = (lecture_end_normalized <= doc_end)
                        
                        if fits_in_availability:
                            lecture_end = lecture_end_normalized
                            
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
                                    scheduled_this_day = True
                                    days_scheduled_count += 1
                                    break
                
                # Fallback to default times
                if not scheduled_this_day:
                    default_times = [8 * 60, 9 * 60, 10 * 60, 11 * 60, 12 * 60, 13 * 60, 14 * 60, 15 * 60, 16 * 60]
                    shuffled_rooms = available_rooms.copy()
                    random.shuffle(shuffled_rooms)
                    
                    for default_start in default_times:
                        default_end = default_start + duration_minutes
                        for room in shuffled_rooms:
                            if not self.has_conflict(schedule, day, instructor_id, default_start, default_end, 
                                                     check_room=room, check_division=div_id):
                                schedule.append({
                                    'Day': day,
                                    'Course_ID': course_id,
                                    'Instructor_ID': instructor_id,
                                    'Group_ID': div_id,
                                    'Room_ID': room,
                                    'Time_Slot': f"{day}_{default_start}_{default_end}",
                                    'Start_Time': default_start,
                                    'End_Time': default_end,
                                    'Duration': duration_minutes
                                })
                                days_scheduled_count += 1
                                break
                        else:
                            continue
                        break
        
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
            
            # Capacity violation
            room_capacity = self.rooms_df[self.rooms_df['Room_ID'] == room]['Capacity'].iloc[0]
            div_students = self.divisions_df[self.divisions_df['Num_ID'] == division]['StudentNum'].iloc[0]
            if room_capacity < div_students:
                violations += 10
                penalty += 100
            
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
                    violations += 5
                    penalty += 50
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
                    violations += 5
                    penalty += 50
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
        
        return violations + penalty / 1000
    
    def crossover(self, parent1: List[Dict], parent2: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Perform crossover between two parents."""
        if random.random() > self.crossover_rate:
            return parent1.copy(), parent2.copy()
        
        child1 = []
        child2 = []
        
        p1_assignments = {(a['Course_ID'], a['Group_ID']): a for a in parent1}
        p2_assignments = {(a['Course_ID'], a['Group_ID']): a for a in parent2}
        
        all_pairs = set(list(p1_assignments.keys()) + list(p2_assignments.keys()))
        split_point = len(all_pairs) // 2
        
        pairs_list = list(all_pairs)
        random.shuffle(pairs_list)
        
        for i, pair in enumerate(pairs_list):
            if i < split_point:
                if pair in p1_assignments:
                    child1.append(p1_assignments[pair].copy())
                if pair in p2_assignments:
                    child2.append(p2_assignments[pair].copy())
            else:
                if pair in p2_assignments:
                    child1.append(p2_assignments[pair].copy())
                if pair in p1_assignments:
                    child2.append(p1_assignments[pair].copy())
        
        return child1, child2
    
    def mutate(self, individual: List[Dict]) -> List[Dict]:
        """Apply mutation to an individual."""
        if random.random() > self.mutation_rate:
            return individual
        
        mutated = individual.copy()
        
        if len(mutated) == 0:
            return mutated
        
        mutation_type = random.choice(['change_room', 'change_time', 'remove', 'add'])
        
        if mutation_type == 'change_room' and len(mutated) > 0:
            idx = random.randint(0, len(mutated) - 1)
            assignment = mutated[idx]
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
        
        elif mutation_type == 'remove' and len(mutated) > 0:
            mutated.pop(random.randint(0, len(mutated) - 1))
        
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
        
        return population[best_idx], best_fitness_history
    
    def format_schedule(self, schedule: List[Dict]) -> List[Dict]:
        """Format the schedule for output."""
        formatted = []
        
        for assignment in schedule:
            course_id = assignment['Course_ID']
            instructor_id = assignment['Instructor_ID']
            group_id = assignment['Group_ID']
            room_id = assignment['Room_ID']
            day = assignment['Day']
            
            course_info = self.courses_df[self.courses_df['Course_ID'] == course_id].iloc[0]
            instructor_info = self.doctors_df[self.doctors_df['Instructor_ID'] == instructor_id].iloc[0]
            division_info = self.divisions_df[self.divisions_df['Num_ID'] == group_id].iloc[0]
            room_info = self.rooms_df[self.rooms_df['Room_ID'] == room_id].iloc[0]
            
            start_time_min = assignment.get('Start_Time', 0)
            end_time_min = assignment.get('End_Time', 0)
            
            start_time_str = minutes_to_time_str(start_time_min)
            end_time_str = minutes_to_time_str(end_time_min)
            
            formatted.append({
                'day': day,
                'course_name': course_info['Course_Name'],
                'instructor_name': instructor_info['Instructor_Name'],
                'students': int(division_info['StudentNum']),
                'room': room_info['Room'],
                'start_time': start_time_str,
                'end_time': end_time_str,
                'department': course_info['Department'],
                'major': course_info['Major']
            })
        
        return formatted

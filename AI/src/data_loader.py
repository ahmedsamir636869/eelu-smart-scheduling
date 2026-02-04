"""
Data loader service for JSON data.
"""

from typing import Dict, List, Tuple, Any
from .utils import time_to_minutes


class DataLoader:
    """Load and prepare scheduling data from JSON."""
    
    def __init__(self):
        """Initialize the data loader."""
        # Raw data storage
        self.rooms_data: List[Dict] = []
        self.courses_data: List[Dict] = []
        self.doctors_data: List[Dict] = []
        self.divisions_data: List[Dict] = []
        
        # Prepared data structures
        self.room_dict: Dict[str, Dict] = {}
        self.course_dict: Dict[str, Dict] = {}
        self.doctor_availability: Dict[str, Dict[str, List[Tuple[int, int]]]] = {}
        self.division_dict: Dict[str, Dict] = {}
        self.lecture_rooms: List[str] = []
        self.lab_rooms: List[str] = []
        
        self._is_loaded = False
    
    def load_from_json(self, data: Dict[str, List[Dict]]) -> bool:
        """Load all data from JSON input.
        
        Args:
            data: Dictionary containing 'rooms', 'courses', 'doctors', 'divisions' lists.
        
        Returns:
            True if successful, False otherwise.
        """
        try:
            self.rooms_data = data.get('rooms', [])
            self.courses_data = data.get('courses', [])
            self.doctors_data = data.get('doctors', [])
            self.divisions_data = data.get('divisions', [])
            
            self._prepare_data()
            self._is_loaded = True
            return True
        except Exception as e:
            print(f"Error loading data from JSON: {e}")
            return False
    
    def _prepare_data(self):
        """Prepare data structures for the GA."""
        # Room dictionary
        self.room_dict = {
            room['Room_ID']: {
                'capacity': room['Capacity'], 
                'type': room['Type'],
                'name': room['Room']
            } 
            for room in self.rooms_data
        }
        
        # Course dictionary
        self.course_dict = {
            course['Course_ID']: {
                'instructor': course['Instructor_ID'],
                'days': course['Days'],
                'hours_per_day': course['Hours_per_day'],
                'type': course['Type'],
                'year': course['Year'],
                'major': course['Major'],
                'department': course['Department'],
                'name': course['Course_Name']
            } 
            for course in self.courses_data
        }
        
        # Doctor availability
        self.doctor_availability = {}
        for doctor in self.doctors_data:
            inst_id = doctor['Instructor_ID']
            day = doctor['Day']
            start = doctor['Start_Time']
            end = doctor['End_Time']
            start_minutes = time_to_minutes(start)
            end_minutes = time_to_minutes(end)
            
            if inst_id not in self.doctor_availability:
                self.doctor_availability[inst_id] = {}
            if day not in self.doctor_availability[inst_id]:
                self.doctor_availability[inst_id][day] = []
            self.doctor_availability[inst_id][day].append((start_minutes, end_minutes))
        
        # Division dictionary
        self.division_dict = {
            div['Num_ID']: {
                'students': div['StudentNum'],
                'year': div['Year'],
                'major': div['Major'],
                'department': div['Department']
            } 
            for div in self.divisions_data
        }
        
        # Separate rooms by type
        self.lecture_rooms = [r for r in self.room_dict.keys() if self.room_dict[r]['type'] == 'Lecture']
        self.lab_rooms = [r for r in self.room_dict.keys() if self.room_dict[r]['type'] == 'Lab']
    
    def is_loaded(self) -> bool:
        """Check if data has been loaded."""
        return self._is_loaded
    
    def get_stats(self) -> Dict[str, int]:
        """Get statistics about loaded data."""
        unique_doctors = set(d['Instructor_ID'] for d in self.doctors_data) if self.doctors_data else set()
        return {
            'courses': len(self.course_dict),
            'rooms': len(self.room_dict),
            'doctors': len(unique_doctors),
            'divisions': len(self.division_dict),
            'lecture_rooms': len(self.lecture_rooms),
            'lab_rooms': len(self.lab_rooms)
        }

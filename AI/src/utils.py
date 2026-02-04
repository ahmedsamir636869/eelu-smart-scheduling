"""
Utility functions for time parsing and conflict detection.
Extracted from the GA notebook.
"""

from datetime import time as dt_time
from typing import Union, Tuple


def parse_time(t: str) -> int:
    """Parse time string (HH:MM) to minutes since midnight."""
    h, m = map(int, str(t).split(":"))
    return h * 60 + m


def time_ranges_overlap(start1: int, end1: int, start2: int, end2: int) -> bool:
    """Check if two time ranges overlap."""
    return not (end1 <= start2 or end2 <= start1)


def parse_time_extended(time_str: str) -> int:
    """Parse extended time format (with AM/PM) to minutes since midnight."""
    try:
        if isinstance(time_str, str):
            time_str = time_str.strip().upper()
            
            is_pm = 'PM' in time_str
            is_am = 'AM' in time_str
            
            time_str = time_str.replace('AM', '').replace('PM', '').strip()
            
            parts = time_str.split(':')
            hours = int(parts[0])
            minutes = int(parts[1]) if len(parts) > 1 else 0
            
            if hours == 12:
                if is_am:
                    hours = 0
            elif is_pm and hours != 12:
                hours += 12
            
            return hours * 60 + minutes
        return 0
    except:
        return 0


def minutes_to_time_str(minutes: int) -> str:
    """Convert minutes since midnight to time string (12-hour format)."""
    if minutes == 0:
        return "12:00 AM"
    hours = minutes // 60
    mins = minutes % 60
    hours = hours % 24
    
    if hours == 0:
        hour_12 = 12
        period = "AM"
    elif hours < 12:
        hour_12 = hours
        period = "AM"
    elif hours == 12:
        hour_12 = 12
        period = "PM"
    else:
        hour_12 = hours - 12
        period = "PM"
    
    return f"{hour_12}:{mins:02d} {period}"


def is_time_in_range(time_minutes: int, start_minutes: int, end_minutes: int) -> bool:
    """Check if a time is within a range (handles overnight ranges)."""
    if end_minutes < start_minutes:
        return time_minutes >= start_minutes or time_minutes <= end_minutes
    return start_minutes <= time_minutes <= end_minutes


def time_to_minutes(time_value: Union[int, float, str, dt_time]) -> int:
    """Convert various time formats to minutes since midnight."""
    if isinstance(time_value, (int, float)):
        return int(time_value)

    if isinstance(time_value, dt_time):
        return time_value.hour * 60 + time_value.minute
    
    if isinstance(time_value, str):
        result = parse_time_extended(time_value)
        if result > 0:
            return result
        
        try:
            return parse_time(time_value)
        except:
            return 0
    
    return 0

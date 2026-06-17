"""
Test script to verify days validation in Course models.
"""

from src.models import CourseInput

# Test valid cases
print("Testing valid day values...")
try:
    # Course with 1 day (valid)
    course1 = CourseInput(
        Course_ID="CS101",
        Course_Name="Introduction to Programming",
        Department="Computer Science",
        Major="CS",
        Days=1,
        Hours_per_day=2,
        Instructor_ID="INS001",
        Year=1,
        Type="Lecture"
    )
    print(f"[PASS] Course with 1 day: Valid")
except ValueError as e:
    print(f"[FAIL] Course with 1 day: {e}")

try:
    # Course with 2 days (valid)
    course2 = CourseInput(
        Course_ID="CS102",
        Course_Name="Data Structures",
        Department="Computer Science",
        Major="CS",
        Days=2,
        Hours_per_day=3,
        Instructor_ID="INS002",
        Year=2,
        Type="Lecture"
    )
    print(f"[PASS] Course with 2 days: Valid")
except ValueError as e:
    print(f"[FAIL] Course with 2 days: {e}")

try:
    # Course with 6 days (valid - edge case)
    course6 = CourseInput(
        Course_ID="CS106",
        Course_Name="Intensive Workshop",
        Department="Computer Science",
        Major="CS",
        Days=6,
        Hours_per_day=2,
        Instructor_ID="INS006",
        Year=3,
        Type="Lab"
    )
    print(f"[PASS] Course with 6 days: Valid")
except ValueError as e:
    print(f"[FAIL] Course with 6 days: {e}")

# Test invalid cases
print("\nTesting invalid day values...")
try:
    # Course with 0 days (invalid)
    course_invalid1 = CourseInput(
        Course_ID="CS999",
        Course_Name="Invalid Course",
        Department="Computer Science",
        Major="CS",
        Days=0,
        Hours_per_day=2,
        Instructor_ID="INS999",
        Year=1,
        Type="Lecture"
    )
    print(f"[FAIL] Course with 0 days: Should have raised ValueError")
except ValueError as e:
    print(f"[PASS] Course with 0 days: Correctly rejected ({e})")

try:
    # Course with 7 days (invalid)
    course_invalid2 = CourseInput(
        Course_ID="CS998",
        Course_Name="Invalid Course 2",
        Department="Computer Science",
        Major="CS",
        Days=7,
        Hours_per_day=2,
        Instructor_ID="INS998",
        Year=1,
        Type="Lecture"
    )
    print(f"[FAIL] Course with 7 days: Should have raised ValueError")
except ValueError as e:
    print(f"[PASS] Course with 7 days: Correctly rejected ({e})")

try:
    # Course with negative days (invalid)
    course_invalid3 = CourseInput(
        Course_ID="CS997",
        Course_Name="Invalid Course 3",
        Department="Computer Science",
        Major="CS",
        Days=-1,
        Hours_per_day=2,
        Instructor_ID="INS997",
        Year=1,
        Type="Lecture"
    )
    print(f"[FAIL] Course with -1 days: Should have raised ValueError")
except ValueError as e:
    print(f"[PASS] Course with -1 days: Correctly rejected ({e})")

print("\n" + "="*50)
print("Days validation test completed!")
print("="*50)

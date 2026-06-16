const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const result = {};
  
  // Get ALL colleges with their campus info
  const allColleges = await prisma.college.findMany({
    include: { campus: true }
  });
  
  result.allColleges = allColleges.map(c => ({
    id: c.id,
    name: c.name,
    campusId: c.campusId,
    campusName: c.campus?.name || 'ORPHANED (No Campus)'
  }));
  
  // Find orphaned colleges (no campus)
  const orphanedColleges = allColleges.filter(c => !c.campusId);
  result.orphanedColleges = orphanedColleges.map(c => c.id);
  
  // Check data in orphaned colleges
  if (orphanedColleges.length > 0) {
    const orphanedIds = orphanedColleges.map(c => c.id);
    
    // Courses in orphaned colleges
    const orphanedCourses = await prisma.course.findMany({
      where: { collegeId: { in: orphanedIds } }
    });
    result.coursesInOrphanedColleges = orphanedCourses.length;
    
    // Get departments in orphaned colleges
    const orphanedDepartments = await prisma.department.findMany({
      where: { collegeId: { in: orphanedIds } }
    });
    result.departmentsInOrphanedColleges = orphanedDepartments.length;
    const orphanedDeptIds = orphanedDepartments.map(d => d.id);
    
    // Instructors in orphaned departments
    const orphanedInstructors = await prisma.instructor.findMany({
      where: { departmentId: { in: orphanedDeptIds } }
    });
    result.instructorsInOrphanedColleges = orphanedInstructors.length;
    
    // Student groups in orphaned departments
    const orphanedGroups = await prisma.studentGroup.findMany({
      where: { departmentId: { in: orphanedDeptIds } }
    });
    result.studentGroupsInOrphanedColleges = orphanedGroups.length;
  }
  
  fs.writeFileSync('orphan-check.json', JSON.stringify(result, null, 2));
  console.log('Results written to orphan-check.json');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

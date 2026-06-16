const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateOrphanedDataToAssiut() {
  console.log('=== Migrating Orphaned Data to Assiut ===\n');
  
  // Assiut campus and college IDs
  const assiutCampusId = 'cmle3hfd80000p060gumfi1d4';
  const assiutITCollegeId = 'cmle3hfdc0001p0609n0ply5z';
  const assiutBusinessCollegeId = 'cmle3hfdc0002p060myqhz5xq';
  const assiutITDeptId = 'cmle3hgt00004p0609q287g20';
  const assiutBusinessDeptId = 'cmle3hhjw0006p060ssf94aa9';
  
  // Orphaned college IDs
  const orphanedCollegeIds = [
    'cml9l59ca0001p074mz6i936f',  // IT
    'cml9l59cb0002p07477do3hjk',  // Business
    'cmlbf098f0001fcy4fpfu1pro',  // IT
    'cmlbf098f0002fcy47n6yff8p',  // Business
  ];
  
  const orphanedITCollegeIds = ['cml9l59ca0001p074mz6i936f', 'cmlbf098f0001fcy4fpfu1pro'];
  const orphanedBusinessCollegeIds = ['cml9l59cb0002p07477do3hjk', 'cmlbf098f0002fcy47n6yff8p'];
  
  try {
    // Step 1: Move courses from orphaned IT colleges to Assiut IT college
    console.log('Step 1: Moving courses...');
    const courseResult = await prisma.course.updateMany({
      where: { collegeId: { in: orphanedITCollegeIds } },
      data: { 
        collegeId: assiutITCollegeId,
        departmentId: assiutITDeptId 
      }
    });
    console.log(`  Moved ${courseResult.count} courses to Assiut IT`);
    
    // Also move any Business courses
    const businessCourseResult = await prisma.course.updateMany({
      where: { collegeId: { in: orphanedBusinessCollegeIds } },
      data: { 
        collegeId: assiutBusinessCollegeId,
        departmentId: assiutBusinessDeptId 
      }
    });
    console.log(`  Moved ${businessCourseResult.count} courses to Assiut Business`);
    
    // Step 2: Get orphaned departments
    console.log('\nStep 2: Finding orphaned departments...');
    const orphanedDepartments = await prisma.department.findMany({
      where: { collegeId: { in: orphanedCollegeIds } }
    });
    console.log(`  Found ${orphanedDepartments.length} orphaned departments`);
    
    const orphanedDeptIds = orphanedDepartments.map(d => d.id);
    
    // Step 3: Move instructors from orphaned departments to Assiut departments
    console.log('\nStep 3: Moving instructors...');
    // Determine which orphaned departments are IT vs Business
    const orphanedITDeptIds = [];
    const orphanedBusinessDeptIds = [];
    for (const dept of orphanedDepartments) {
      if (orphanedITCollegeIds.includes(dept.collegeId)) {
        orphanedITDeptIds.push(dept.id);
      } else {
        orphanedBusinessDeptIds.push(dept.id);
      }
    }
    
    if (orphanedITDeptIds.length > 0) {
      const itInstructorResult = await prisma.instructor.updateMany({
        where: { departmentId: { in: orphanedITDeptIds } },
        data: { departmentId: assiutITDeptId }
      });
      console.log(`  Moved ${itInstructorResult.count} instructors to Assiut IT dept`);
    }
    
    if (orphanedBusinessDeptIds.length > 0) {
      const businessInstructorResult = await prisma.instructor.updateMany({
        where: { departmentId: { in: orphanedBusinessDeptIds } },
        data: { departmentId: assiutBusinessDeptId }
      });
      console.log(`  Moved ${businessInstructorResult.count} instructors to Assiut Business dept`);
    }
    
    // Step 4: Move student groups from orphaned departments
    console.log('\nStep 4: Moving student groups...');
    if (orphanedITDeptIds.length > 0) {
      const itGroupResult = await prisma.studentGroup.updateMany({
        where: { departmentId: { in: orphanedITDeptIds } },
        data: { departmentId: assiutITDeptId }
      });
      console.log(`  Moved ${itGroupResult.count} student groups to Assiut IT dept`);
    }
    
    if (orphanedBusinessDeptIds.length > 0) {
      const businessGroupResult = await prisma.studentGroup.updateMany({
        where: { departmentId: { in: orphanedBusinessDeptIds } },
        data: { departmentId: assiutBusinessDeptId }
      });
      console.log(`  Moved ${businessGroupResult.count} student groups to Assiut Business dept`);
    }
    
    // Step 5: Delete orphaned departments
    console.log('\nStep 5: Deleting orphaned departments...');
    if (orphanedDeptIds.length > 0) {
      const deletedDepts = await prisma.department.deleteMany({
        where: { id: { in: orphanedDeptIds } }
      });
      console.log(`  Deleted ${deletedDepts.count} orphaned departments`);
    }
    
    // Step 6: Delete orphaned colleges
    console.log('\nStep 6: Deleting orphaned colleges...');
    const deletedColleges = await prisma.college.deleteMany({
      where: { id: { in: orphanedCollegeIds } }
    });
    console.log(`  Deleted ${deletedColleges.count} orphaned colleges`);
    
    // Verify final state
    console.log('\n=== Verification ===');
    const assiutCourses = await prisma.course.count({
      where: { collegeId: { in: [assiutITCollegeId, assiutBusinessCollegeId] } }
    });
    const assiutInstructors = await prisma.instructor.count({
      where: { departmentId: { in: [assiutITDeptId, assiutBusinessDeptId] } }
    });
    const assiutGroups = await prisma.studentGroup.count({
      where: { departmentId: { in: [assiutITDeptId, assiutBusinessDeptId] } }
    });
    const assiutRooms = await prisma.classroom.count({
      where: { campusId: assiutCampusId }
    });
    
    console.log(`\nAssiut now has:`);
    console.log(`  Classrooms: ${assiutRooms}`);
    console.log(`  Courses: ${assiutCourses}`);
    console.log(`  Instructors: ${assiutInstructors}`);
    console.log(`  Student Groups: ${assiutGroups}`);
    
    const canGenerate = assiutRooms > 0 && assiutCourses > 0 && assiutInstructors > 0 && assiutGroups > 0;
    console.log(`\n${canGenerate ? '✅ CAN NOW GENERATE SCHEDULES!' : '❌ Still missing data'}`);
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

migrateOrphanedDataToAssiut()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

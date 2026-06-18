const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const campuses = await prisma.campus.findMany();
  const assiut = campuses.find((c) => c.name.toLowerCase().includes('assiut'));

  if (!assiut) {
    throw new Error(
      `Assiut campus not found. Available campuses: ${campuses
        .map((c) => c.name)
        .join(', ')}`
    );
  }

  const unassigned = await prisma.schedule.findMany({
    where: { campusId: null },
    select: { id: true, semester: true, generatedBy: true, createdAt: true },
  });

  if (unassigned.length === 0) {
    console.log('No unassigned schedules found. Nothing to backfill.');
    return;
  }

  console.log(`Found ${unassigned.length} unassigned schedule(s):`);
  unassigned.forEach((s) =>
    console.log(`  - ${s.id} | ${s.semester} | ${s.generatedBy}`)
  );

  const result = await prisma.schedule.updateMany({
    where: { campusId: null },
    data: { campusId: assiut.id },
  });

  console.log(
    `Assigned ${result.count} schedule(s) to Assiut campus (${assiut.name}, ${assiut.id}).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

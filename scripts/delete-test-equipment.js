const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Looking for test equipment...');
  
  // First, find all equipment
  const allEquipment = await prisma.resource.findMany({
    where: {
      category: 'EQUIPMENT'
    }
  });
  
  // Filter for test equipment manually
  const testEquipment = allEquipment.filter(eq => 
    eq.name.toLowerCase().includes('test') || 
    eq.slug.toLowerCase().includes('test')
  );
  
  console.log(`Found ${testEquipment.length} test equipment items:`);
  testEquipment.forEach(eq => {
    console.log(`  - ${eq.name} (${eq.slug}) [Active: ${eq.isActive}]`);
  });
  
  if (testEquipment.length > 0) {
    console.log('\n🗑️ Deleting all test equipment...');
    const deleted = await prisma.resource.deleteMany({
      where: {
        id: { in: testEquipment.map(eq => eq.id) }
      }
    });
    console.log(`✅ Deleted ${deleted.count} equipment records`);
  } else {
    console.log('✅ No test equipment found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
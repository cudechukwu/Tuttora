import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDepartmentNames() {
  try {
    console.log('🔍 Analyzing department names in database...\n');

    // Get all unique department names
    const departments = await prisma.course.findMany({
      select: {
        department: true,
      },
      distinct: ['department'],
    });

    console.log('📚 Current department names:');
    departments.forEach(dept => console.log(`  - ${dept.department}`));

    // Define the correct department mappings
    const departmentMappings = {
      'Computer Science': 'COMP',
      'Physics': 'PHYS',
      'Mathematics': 'MATH',
      'Chemistry': 'CHEM',
      // Add more mappings as needed
    };

    console.log('\n🔄 Department name mappings to apply:');
    Object.entries(departmentMappings).forEach(([old, newName]) => {
      console.log(`  ${old} → ${newName}`);
    });

    // Count courses that will be affected
    let totalAffected = 0;
    for (const [oldName, newName] of Object.entries(departmentMappings)) {
      const count = await prisma.course.count({
        where: { department: oldName }
      });
      if (count > 0) {
        console.log(`\n📊 ${oldName}: ${count} courses will be updated`);
        totalAffected += count;
      }
    }

    if (totalAffected === 0) {
      console.log('\n✅ No courses need to be updated!');
      return;
    }

    console.log(`\n⚠️  Total courses to update: ${totalAffected}`);
    
    // Ask for confirmation (you can remove this in production)
    console.log('\n🚀 Proceeding with updates...\n');

    // Update the department names
    for (const [oldName, newName] of Object.entries(departmentMappings)) {
      const result = await prisma.course.updateMany({
        where: { department: oldName },
        data: { department: newName }
      });
      
      if (result.count > 0) {
        console.log(`✅ Updated ${result.count} courses: ${oldName} → ${newName}`);
      }
    }

    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const updatedDepartments = await prisma.course.findMany({
      select: {
        department: true,
      },
      distinct: ['department'],
    });

    console.log('\n📚 Updated department names:');
    updatedDepartments.forEach(dept => console.log(`  - ${dept.department}`));

    console.log('\n🎉 Department name cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixDepartmentNames();

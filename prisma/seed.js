const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Full system access' },
  });

  await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: { name: 'editor', description: 'Can create and edit SOPs' },
  });

  await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: { name: 'viewer', description: 'Read-only access to published SOPs' },
  });

  console.log('✅ Roles created');

  // Create admin user
  const hashedPassword = await bcrypt.hash('123123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'Admin' },
    update: {},
    create: {
      email: 'Admin',
      passwordHash: hashedPassword,
      fullName: 'System Administrator',
      department: 'IT',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  console.log('✅ Admin user created: Admin / 123123');

  // Create root categories
  const opsCategory = await prisma.category.upsert({
    where: { slug: 'transport-management' },
    update: {},
    create: {
      name: 'Transport Management',
      slug: 'transport-management',
      description: 'All transport and logistics SOPs',
      icon: '🚌',
      sortOrder: 1,
      createdById: adminUser.id,
    },
  });

  const csCategory = await prisma.category.upsert({
    where: { slug: 'territory-customer-service' },
    update: {},
    create: {
      name: 'Territory Customer Service',
      slug: 'territory-customer-service',
      description: 'Customer service procedures',
      icon: '🤝',
      sortOrder: 2,
      createdById: adminUser.id,
    },
  });

  const exCategory = await prisma.category.upsert({
    where: { slug: 'operational-excellence' },
    update: {},
    create: {
      name: 'Operational Excellence',
      slug: 'operational-excellence',
      description: 'Operational best practices',
      icon: '⭐',
      sortOrder: 3,
      createdById: adminUser.id,
    },
  });

  // Sub-category: Drivers Management
  const driversCategory = await prisma.category.upsert({
    where: { slug: 'drivers-management' },
    update: {},
    create: {
      name: 'Drivers Management',
      slug: 'drivers-management',
      parentId: opsCategory.id,
      sortOrder: 1,
      createdById: adminUser.id,
    },
  });

  console.log('✅ Categories created');

  // Sample SOP: Door Failure
  const doorFailureSop = await prisma.sop.upsert({
    where: { referenceCode: 'TAC-RTM-002-1-1-3' },
    update: {},
    create: {
      title: 'Door Failure',
      referenceCode: 'TAC-RTM-002-1-1-3',
      categoryId: driversCategory.id,
      ownerId: adminUser.id,
      docType: 'SOP',
      status: 'published',
      currentVersion: '1.0',
      publishedAt: new Date(),
    },
  });

  // Create first version with steps
  const existing = await prisma.sopVersion.findFirst({
    where: { sopId: doorFailureSop.id, version: '1.0' },
  });

  if (!existing) {
    const steps = [
      { stepNumber: 1, title: 'Make PA to passengers', stepType: 'action', refCode: 'WI-RTM-H11', sortOrder: 1 },
      { stepNumber: 2, title: 'Inform the CCP', stepType: 'action', sortOrder: 2 },
      { stepNumber: 3, title: 'Secure the cabin', stepType: 'action', refCode: 'WI-RTM-M1', sortOrder: 3 },
      { stepNumber: 4, title: 'Head to the affected car(s)', stepType: 'action', sortOrder: 4 },
      { stepNumber: 5, title: 'Inspect the affected door', stepType: 'action', sortOrder: 5 },
      { stepNumber: 6, title: 'Any item blocking the door rail?', stepType: 'decision', sortOrder: 6 },
      { stepNumber: 7, title: 'Isolate the door', stepType: 'action', refCode: 'WI-RTM-D14', sortOrder: 7 },
      { stepNumber: 8, title: 'Remove the item', stepType: 'action', sortOrder: 8 },
    ];

    const contentJson = JSON.stringify({ steps });

    const version = await prisma.sopVersion.create({
      data: {
        sopId: doorFailureSop.id,
        version: '1.0',
        contentJson,
        isCurrent: true,
        createdById: adminUser.id,
      },
    });

    await prisma.changeLog.create({
      data: {
        sopId: doorFailureSop.id,
        versionFrom: null,
        versionTo: '1.0',
        changeSummary: 'Initial version created',
        changedById: adminUser.id,
      },
    });

    // Create steps linked to version
    for (const step of steps) {
      await prisma.sopStep.create({
        data: {
          sopId: doorFailureSop.id,
          versionId: version.id,
          ...step,
        },
      });
    }
  }

  console.log('✅ Sample SOP created: Door Failure');
  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

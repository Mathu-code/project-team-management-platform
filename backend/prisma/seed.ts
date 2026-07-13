import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // --- Users ---
  await prisma.user.upsert({
    where: { email: 'admin@cyphlab.com' },
    update: {},
    create: {
      email: 'admin@cyphlab.com',
      name: 'Site Admin',
      role: 'ADMIN',
      passwordHash,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@cyphlab.com' },
    update: {},
    create: {
      email: 'pm@cyphlab.com',
      name: 'Priya Manager',
      role: 'PROJECT_MANAGER',
      passwordHash,
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: 'alice@cyphlab.com' },
    update: {},
    create: {
      email: 'alice@cyphlab.com',
      name: 'Alice Developer',
      role: 'TEAM_MEMBER',
      passwordHash,
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'bob@cyphlab.com' },
    update: {},
    create: {
      email: 'bob@cyphlab.com',
      name: 'Bob Tester',
      role: 'TEAM_MEMBER',
      passwordHash,
    },
  });

  // --- Project ---
  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Website Redesign',
      description: 'Redesign the company marketing website.',
      status: 'ACTIVE',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-09-30'),
      createdById: pm.id,
    },
  });

  // --- Memberships ---
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: pm.id } },
    update: {},
    create: { projectId: project.id, userId: pm.id, role: 'MANAGER' },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member1.id } },
    update: {},
    create: { projectId: project.id, userId: member1.id, role: 'MEMBER' },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member2.id } },
    update: {},
    create: { projectId: project.id, userId: member2.id, role: 'MEMBER' },
  });

  // --- Tasks ---
  const task1 = await prisma.task.create({
    data: {
      title: 'Design homepage mockups',
      description: 'Create Figma mockups for the new homepage.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2026-07-20'),
      projectId: project.id,
      assigneeId: member1.id,
      createdById: pm.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Set up CI pipeline',
      description: 'Configure GitHub Actions for lint and build.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date('2026-07-25'),
      projectId: project.id,
      assigneeId: member2.id,
      createdById: pm.id,
    },
  });

  // --- Comment ---
  await prisma.comment.create({
    data: {
      content: 'Mockups look great, please use the new brand colors.',
      taskId: task1.id,
      userId: pm.id,
    },
  });

  console.log('Seed completed.');
  console.log('Login credentials (password for all): Password123!)');
  console.log('  ADMIN           : admin@cyphlab.com');
  console.log('  PROJECT_MANAGER : pm@cyphlab.com');
  console.log('  TEAM_MEMBER     : alice@cyphlab.com / bob@cyphlab.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

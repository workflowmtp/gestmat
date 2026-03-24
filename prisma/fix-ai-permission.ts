import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the ai.agent permission
  const aiPerm = await prisma.permission.findUnique({ where: { code: 'ai.agent' } });
  if (!aiPerm) {
    console.log('❌ Permission ai.agent not found');
    return;
  }

  // Get all roles
  const roles = await prisma.role.findMany();

  for (const role of roles) {
    // Check if already assigned
    const existing = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: role.id, permissionId: aiPerm.id } },
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: aiPerm.id },
      });
      console.log(`✅ Added ai.agent to role: ${role.label}`);
    } else {
      console.log(`⏭  Role ${role.label} already has ai.agent`);
    }
  }

  console.log('Done!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

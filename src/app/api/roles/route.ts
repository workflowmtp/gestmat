import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/roles — Liste tous les rôles avec leurs permissions
export async function GET() {
  try {
    await requirePermission('config.roles');

    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
      orderBy: { level: 'desc' },
    });

    return NextResponse.json({
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        label: r.label,
        level: r.level,
        builtIn: r.builtIn,
        userCount: r._count.users,
        permissions: r.permissions.map((rp) => rp.permission.code),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// POST /api/roles — Créer un nouveau rôle
export async function POST(req: NextRequest) {
  try {
    await requirePermission('config.roles');
    const user = await getServerUser();
    const body = await req.json();

    const { name, label, level, permissionCodes } = body;
    if (!name || !label) {
      return NextResponse.json({ error: 'Nom et libellé obligatoires' }, { status: 400 });
    }

    // Vérifier unicité
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Ce nom de rôle existe déjà' }, { status: 400 });
    }

    // Créer le rôle
    const role = await prisma.role.create({
      data: { name, label, level: level || 0, builtIn: false },
    });

    // Assigner les permissions
    if (permissionCodes && permissionCodes.length > 0) {
      const perms = await prisma.permission.findMany({
        where: { code: { in: permissionCodes } },
      });
      await prisma.rolePermission.createMany({
        data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }

    // Audit
    await prisma.auditLog.create({
      data: {
        action: 'config',
        detail: 'Création rôle : ' + label,
        userId: user?.id,
      },
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/roles — Modifier un rôle (id dans le body)
export async function PUT(req: NextRequest) {
  try {
    await requirePermission('config.roles');
    const user = await getServerUser();
    const body = await req.json();

    const { id, label, level, permissionCodes } = body;
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ error: 'Rôle introuvable' }, { status: 404 });

    // Mettre à jour le rôle
    await prisma.role.update({
      where: { id },
      data: { label: label || role.label, level: level ?? role.level },
    });

    // Mettre à jour les permissions (supprimer toutes + recréer)
    if (permissionCodes !== undefined) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });

      if (permissionCodes.length > 0) {
        const perms = await prisma.permission.findMany({
          where: { code: { in: permissionCodes } },
        });
        await prisma.rolePermission.createMany({
          data: perms.map((p) => ({ roleId: id, permissionId: p.id })),
          skipDuplicates: true,
        });
      }
    }

    await prisma.auditLog.create({
      data: { action: 'config', detail: 'Modification rôle : ' + (label || role.label), userId: user?.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/roles — Supprimer un rôle (non built-in, sans users)
export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('config.roles');
    const user = await getServerUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) return NextResponse.json({ error: 'Rôle introuvable' }, { status: 404 });
    if (role.builtIn) return NextResponse.json({ error: 'Impossible de supprimer un rôle système' }, { status: 400 });
    if (role._count.users > 0) return NextResponse.json({ error: 'Rôle encore assigné à ' + role._count.users + ' utilisateur(s)' }, { status: 400 });

    // Supprimer permissions + rôle
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.role.delete({ where: { id } });

    await prisma.auditLog.create({
      data: { action: 'config', detail: 'Suppression rôle : ' + role.label, userId: user?.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

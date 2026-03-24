import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/dotations
export async function GET(req: NextRequest) {
  try {
    await requirePermission('dotations.view');
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const employee = searchParams.get('employee') || '';

    const where: any = {};
    if (employee) where.employeeName = employee;
    if (search) {
      where.OR = [
        { employeeName: { contains: search, mode: 'insensitive' } },
        { epiLabel: { contains: search, mode: 'insensitive' } },
        { epiType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const dotations = await prisma.dotation.findMany({
      where,
      include: {
        item: { select: { code: true, designation: true } },
        givenBy: { select: { fullname: true } },
      },
      orderBy: { givenDate: 'desc' },
    });

    // Group by employee
    const byEmployee: Record<string, any[]> = {};
    for (const d of dotations) {
      if (!byEmployee[d.employeeName]) byEmployee[d.employeeName] = [];
      byEmployee[d.employeeName].push(d);
    }

    // Employees list
    const employees = Object.keys(byEmployee).sort();

    return NextResponse.json({ dotations, byEmployee, employees, total: dotations.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// POST /api/dotations
export async function POST(req: NextRequest) {
  try {
    await requirePermission('dotations.create');
    const user = await getServerUser();
    const body = await req.json();

    if (!body.employeeName || !body.epiType || !body.epiLabel) {
      return NextResponse.json({ error: 'Employé, type et libellé EPI obligatoires' }, { status: 400 });
    }

    const renewalDate = body.durationDays
      ? new Date(Date.now() + (body.durationDays || 180) * 86400000)
      : null;

    const dotation = await prisma.dotation.create({
      data: {
        employeeName: body.employeeName,
        epiType: body.epiType,
        epiLabel: body.epiLabel,
        itemId: body.itemId || null,
        givenDate: body.givenDate ? new Date(body.givenDate) : new Date(),
        qty: body.qty || 1,
        durationDays: body.durationDays || 180,
        renewalDate,
        size: body.size || null,
        acknowledged: body.acknowledged || false,
        comment: body.comment || null,
        givenById: user?.id || null,
      },
    });

    await prisma.auditLog.create({
      data: { action: 'creation', detail: 'Dotation EPI : ' + body.epiLabel + ' → ' + body.employeeName, userId: user?.id },
    });

    return NextResponse.json({ dotation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

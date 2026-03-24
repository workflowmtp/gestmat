import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// POST /api/campaigns/[id]/validate
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('campaigns.validate');
    const user = await getServerUser();
    const { id } = await params;

    const campaign = await prisma.inventoryCampaign.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    if (campaign.status === 'validé') return NextResponse.json({ error: 'Campagne déjà validée' }, { status: 400 });

    // Check all lines are counted
    const uncounted = campaign.lines.filter((l) => l.physicalQty === null).length;
    if (uncounted > 0) {
      return NextResponse.json({ error: uncounted + ' ligne(s) non comptée(s)' }, { status: 400 });
    }

    // Apply corrections for lines with ecart
    let corrections = 0;
    for (const line of campaign.lines) {
      if (line.ecart && line.ecart !== 0 && line.physicalQty !== null) {
        await prisma.item.update({
          where: { id: line.itemId },
          data: { qty: line.physicalQty, qtyAvailable: line.physicalQty },
        });

        // Movement for correction
        await prisma.movement.create({
          data: {
            itemId: line.itemId,
            type: 'correction inventaire',
            origin: 'Inventaire ' + campaign.name,
            destination: 'Stock corrigé',
            userId: user!.id,
            qty: Math.abs(line.ecart),
            reason: 'Correction inventaire : écart ' + (line.ecart > 0 ? '+' : '') + line.ecart,
            validator: user!.name,
          },
        });
        corrections++;
      }
    }

    // Close campaign
    await prisma.inventoryCampaign.update({
      where: { id },
      data: { status: 'validé', validatedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        action: 'validation',
        detail: 'Validation inventaire : ' + campaign.name + ' (' + corrections + ' corrections)',
        userId: user?.id,
      },
    });

    return NextResponse.json({ success: true, corrections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

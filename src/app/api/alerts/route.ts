import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions';
import { computeAlerts } from '@/lib/alert-engine';

// GET /api/alerts
export async function GET(req: NextRequest) {
  try {
    await requirePermission('alerts.view');
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';

    let alerts = await computeAlerts();

    if (category) {
      alerts = alerts.filter((a) => a.module === category);
    }

    // Stats by module
    const byModule: Record<string, number> = {};
    const bySeverity: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    const allAlerts = await computeAlerts();
    for (const a of allAlerts) {
      byModule[a.module] = (byModule[a.module] || 0) + 1;
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
    }

    return NextResponse.json({ alerts, total: allAlerts.length, byModule, bySeverity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

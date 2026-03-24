import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getServerUser } from '@/lib/permissions';
import prisma from '@/lib/prisma';

// POST /api/ai/webhook — Proxy vers le webhook n8n
export async function POST(req: NextRequest) {
  try {
    await requirePermission('ai.agent');
    const user = await getServerUser();

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const webhookUser = process.env.N8N_WEBHOOK_USER;
    const webhookPassword = process.env.N8N_WEBHOOK_PASSWORD;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook n8n non configuré (N8N_WEBHOOK_URL)' }, { status: 503 });
    }

    const body = await req.json();

    // Forward to n8n with Basic Auth
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (webhookUser && webhookPassword) {
      headers['Authorization'] = 'Basic ' + Buffer.from(`${webhookUser}:${webhookPassword}`).toString('base64');
    }

    console.log('[AI Webhook] URL:', webhookUrl);
    console.log('[AI Webhook] Auth:', webhookUser ? 'Basic Auth configured' : 'No auth');

    const n8nBody = JSON.stringify({
      query: body.query,
      context: body.context || {},
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      timestamp: new Date().toISOString(),
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: n8nBody,
    });

    const responseText = await response.text();
    console.log('[AI Webhook] n8n status:', response.status);
    console.log('[AI Webhook] n8n response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erreur webhook n8n: ' + response.status + ' - ' + responseText.substring(0, 200) },
        { status: 502 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { output: responseText };
    }

    // Log dans audit
    await prisma.auditLog.create({
      data: {
        action: 'ai',
        detail: 'Requête agent IA: ' + (body.query || '').substring(0, 100),
        userId: user?.id,
      },
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

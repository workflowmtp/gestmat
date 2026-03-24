// Client-side helper to interact with the n8n AI agent
export async function queryAiAgent(query: string, context?: Record<string, any>) {
  const response = await fetch('/api/ai/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, context }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || 'Erreur agent IA');
  }

  return response.json();
}

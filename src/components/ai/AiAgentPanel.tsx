'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { hasPermission } from '@/lib/permissions';
import { useAppStore } from '@/stores/app-store';
import { queryAiAgent } from '@/lib/n8n';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

export default function AiAgentPanel() {
  const currentUser = useAppStore((s) => s.currentUser);
  const perms = currentUser?.permissions || [];
  const canUseAi = hasPermission(perms, 'ai.agent');

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: 'Bonjour ! Je suis l\'assistant IA GEST-MAT. Je peux vous aider à analyser votre stock, vos alertes, vos mouvements ou toute question relative à la gestion de votre parc matériel.', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  if (!canUseAi) return null;

  async function handleSend() {
    const query = input.trim();
    if (!query || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await queryAiAgent(query, { userName: currentUser?.fullname });
      const reply = data.output || data.response || data.message || data.text || JSON.stringify(data);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'error', content: err.message || 'Erreur de connexion à l\'agent IA. Vérifiez la configuration N8N_WEBHOOK_URL dans .env.', timestamp: new Date() }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Toggle button */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white text-2xl flex items-center justify-center shadow-xl hover:bg-accent-hover transition-all z-[90] print:hidden"
        title="Agent IA GEST-MAT">
        🤖
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed right-0 top-0 h-full w-[400px] max-w-[90vw] bg-gm-card border-l border-gm-border shadow-2xl z-[95] flex flex-col animate-fade print:hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gm-border">
            <span className="text-2xl">🤖</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Agent IA GEST-MAT</h3>
              <span className="text-xs text-txt-muted">Connecté via n8n</span>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-gm-sm bg-gm-input text-txt-secondary flex items-center justify-center hover:bg-danger-bg hover:text-danger transition-all">×</button>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-gm-sm px-4 py-2.5 text-sm ${
                  msg.role === 'user' ? 'bg-accent text-white' :
                  msg.role === 'error' ? 'bg-danger-bg text-danger border border-danger/30' :
                  'bg-gm-input text-txt-primary border border-gm-border'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-[0.6rem] mt-1 block ${msg.role === 'user' ? 'text-white/60' : 'text-txt-muted'}`}>
                    {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gm-input border border-gm-border rounded-gm-sm px-4 py-3 flex gap-1.5">
                  <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gm-border">
            <div className="flex gap-2">
              <input type="text" className="gm-input text-sm flex-1" placeholder="Posez votre question..."
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading} />
              <Button onClick={handleSend} disabled={loading || !input.trim()} size="sm">
                ↗
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Résumé du stock', 'Articles en retard', 'Alertes critiques', 'Valorisation'].map((q) => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="text-[0.65rem] px-2 py-1 bg-gm-input border border-gm-border rounded-xl text-txt-muted hover:text-accent hover:border-accent transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

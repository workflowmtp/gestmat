'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setSuccess('');
    setResetUrl('');

    if (!email) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la demande.');
        setLoading(false);
        return;
      }

      setSuccess(data.message);

      // In dev mode, show the reset link
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gm-bg">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(245,158,11,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 50%)'
      }} />

      <div className="relative w-[420px] max-w-[92vw] bg-gm-card border border-gm-border rounded-gm-lg p-10 shadow-2xl animate-fade">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
            GM
          </div>
          <h1 className="text-xl font-bold text-txt-primary">Mot de passe oublié</h1>
          <p className="text-sm text-txt-secondary mt-1">Entrez votre email pour réinitialiser</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-3 mb-4 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-success-bg border border-success/30 rounded-gm-sm px-4 py-3 mb-4 text-sm text-success">
            {success}
          </div>
        )}

        {/* Dev mode reset link */}
        {resetUrl && (
          <div className="bg-accent-light border border-accent/30 rounded-gm-sm px-4 py-3 mb-4 text-sm">
            <p className="font-semibold text-txt-primary mb-1">🔧 Mode développement</p>
            <a href={resetUrl} className="text-accent hover:underline break-all text-xs">
              {resetUrl}
            </a>
          </div>
        )}

        {!success && (
          <>
            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="gm-label">Adresse email</label>
                <input type="email" className="gm-input" placeholder="Votre adresse email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 py-3 rounded-gm-sm text-white font-semibold text-base transition-all hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              {loading ? 'Envoi...' : 'Réinitialiser le mot de passe'}
            </button>
          </>
        )}

        <p className="text-center mt-5 text-sm text-txt-secondary">
          <Link href="/login" className="text-accent hover:underline font-medium">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

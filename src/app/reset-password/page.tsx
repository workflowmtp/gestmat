'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide. Aucun token fourni.');
    }
  }, [token]);

  async function handleReset() {
    setError('');

    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la réinitialisation.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
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
          <h1 className="text-xl font-bold text-txt-primary">Nouveau mot de passe</h1>
          <p className="text-sm text-txt-secondary mt-1">Choisissez un nouveau mot de passe</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-3 mb-4 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Success */}
        {success ? (
          <div className="text-center">
            <div className="bg-success-bg border border-success/30 rounded-gm-sm px-4 py-5 mb-4">
              <span className="text-3xl block mb-2">✅</span>
              <p className="text-sm text-success font-semibold">Mot de passe réinitialisé avec succès !</p>
              <p className="text-xs text-txt-muted mt-1">Redirection vers la connexion...</p>
            </div>
          </div>
        ) : token ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="gm-label">Nouveau mot de passe</label>
                <input type="password" className="gm-input" placeholder="Minimum 6 caractères"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <div>
                <label className="gm-label">Confirmer le mot de passe</label>
                <input type="password" className="gm-input" placeholder="Retapez votre mot de passe"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()} />
              </div>
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full mt-6 py-3 rounded-gm-sm text-white font-semibold text-base transition-all hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              {loading ? 'Réinitialisation...' : 'Réinitialiser'}
            </button>
          </>
        ) : null}

        <p className="text-center mt-5 text-sm text-txt-secondary">
          <Link href="/login" className="text-accent hover:underline font-medium">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError('');

    if (!email || !password || !fullname) {
      setError('Les champs nom complet, email et mot de passe sont requis.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, fullname, email, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription.');
        setLoading(false);
        return;
      }

      router.push('/login?registered=1');
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

      <div className="relative w-[460px] max-w-[92vw] bg-gm-card border border-gm-border rounded-gm-lg p-10 shadow-2xl animate-fade">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
            GM
          </div>
          <h1 className="text-xl font-bold text-txt-primary">Créer un compte</h1>
          <p className="text-sm text-txt-secondary mt-1">GEST-MAT BTP — Inscription</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-3 mb-4 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="gm-label">Nom complet *</label>
            <input type="text" className="gm-input" placeholder="Jean Dupont"
              value={fullname} onChange={(e) => setFullname(e.target.value)} />
          </div>

          <div>
            <label className="gm-label">Email *</label>
            <input type="email" className="gm-input" placeholder="email@exemple.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="gm-label">Téléphone</label>
            <input type="tel" className="gm-input" placeholder="+237 6XX XXX XXX"
              value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <label className="gm-label">Mot de passe *</label>
            <input type="password" className="gm-input" placeholder="Minimum 6 caractères"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div>
            <label className="gm-label">Confirmer le mot de passe *</label>
            <input type="password" className="gm-input" placeholder="Retapez votre mot de passe"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-gm-sm text-white font-semibold text-base transition-all hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>

        <p className="text-center mt-5 text-sm text-txt-secondary">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

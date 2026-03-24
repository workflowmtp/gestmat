'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError('Identifiant ou mot de passe incorrect.');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gm-bg">
      {/* Background gradient */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(245,158,11,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 50%)'
      }} />

      <div className="relative w-[420px] max-w-[92vw] bg-gm-card border border-gm-border rounded-gm-lg p-12 shadow-2xl animate-fade">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
            GM
          </div>
          <h1 className="text-2xl font-bold text-txt-primary">GEST-MAT BTP</h1>
          <p className="text-sm text-txt-secondary mt-1">Gestion Outillage, EPI & Suivi des Dotations</p>
        </div>

        {/* Registration success */}
        {justRegistered && (
          <div className="bg-success-bg border border-success/30 rounded-gm-sm px-4 py-3 mb-4 text-sm text-success">
            Compte créé avec succès ! Connectez-vous avec vos identifiants.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-3 mb-4 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="mb-5">
          <label className="gm-label">Identifiant</label>
          <input
            type="text"
            className="gm-input"
            placeholder="Votre identifiant"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && document.getElementById('pwd')?.focus()}
          />
        </div>
        <div className="mb-3">
          <label className="gm-label">Mot de passe</label>
          <input
            id="pwd"
            type="password"
            className="gm-input"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 text-sm text-txt-secondary cursor-pointer">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 accent-accent" />
            Rester connecté
          </label>
          <Link href="/forgot-password" className="text-sm text-accent hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-gm-sm text-white font-semibold text-base transition-all hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <div className="mt-6 pt-5 border-t border-gm-border text-center">
          <p className="text-sm text-txt-secondary">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-accent hover:underline font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-7">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4 opacity-50">⚠</div>
        <h2 className="text-xl font-bold mb-2">Une erreur est survenue</h2>
        <p className="text-sm text-txt-secondary mb-6">
          {error.message || 'Erreur inattendue. Veuillez réessayer.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>Retour au dashboard</Button>
          <Button onClick={reset}>Réessayer</Button>
        </div>
        {error.digest && (
          <p className="text-xs text-txt-muted mt-4 font-mono">Code: {error.digest}</p>
        )}
      </div>
    </div>
  );
}

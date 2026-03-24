import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gm-bg">
      <div className="text-center max-w-md px-5">
        <div className="text-8xl mb-4 opacity-30">404</div>
        <h2 className="text-xl font-bold mb-2">Page introuvable</h2>
        <p className="text-sm text-txt-secondary mb-6">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-gm-sm hover:bg-accent-hover transition-all">
          ← Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}

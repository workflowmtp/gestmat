import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'GEST-MAT BTP — Gestion Outillage, EPI & Suivi des Dotations',
  description: 'Application de gestion du parc matériel et équipements BTP',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="fr">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

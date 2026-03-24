import TopHeader from '@/components/layout/TopHeader';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const user = session.user as any;
  const firstName = user?.name?.split(' ')[0] || 'Utilisateur';

  return (
    <>
      <TopHeader title="Tableau de bord" />
      <div className="flex-1 p-7 max-w-[1600px] w-full animate-fade">
        <div className="mb-7">
          <h2 className="text-2xl font-bold mb-1">Bonjour, {firstName}</h2>
          <p className="text-txt-secondary text-sm">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' '}&mdash; Synthèse du parc matériel et équipements
          </p>
        </div>
        <DashboardClient />
      </div>
    </>
  );
}

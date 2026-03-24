import TopHeader from '@/components/layout/TopHeader';
import AlertsClient from '@/components/alerts/AlertsClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AlertsPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      <TopHeader title="Centre d'alertes" />
      <div className="flex-1 p-7 animate-fade">
        <AlertsClient />
      </div>
    </>
  );
}

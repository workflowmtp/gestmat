import TopHeader from '@/components/layout/TopHeader';
import ControlsClient from '@/components/controls/ControlsClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ControlsPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      <TopHeader title="Contrôles & Maintenance" />
      <div className="flex-1 p-7 animate-fade">
        <ControlsClient />
      </div>
    </>
  );
}

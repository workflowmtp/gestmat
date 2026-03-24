import TopHeader from '@/components/layout/TopHeader';
import ReportsClient from '@/components/reports/ReportsClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      <TopHeader title="Rapports & exports" />
      <div className="flex-1 p-7 animate-fade">
        <ReportsClient />
      </div>
    </>
  );
}

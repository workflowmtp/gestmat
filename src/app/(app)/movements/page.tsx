import TopHeader from '@/components/layout/TopHeader';
import MovementsClient from '@/components/movements/MovementsClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MovementsPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      <TopHeader title="Mouvements" />
      <div className="flex-1 p-7 animate-fade">
        <MovementsClient />
      </div>
    </>
  );
}

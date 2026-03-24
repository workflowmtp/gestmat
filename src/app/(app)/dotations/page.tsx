import TopHeader from '@/components/layout/TopHeader';
import DotationsClient from '@/components/dotations/DotationsClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DotationsPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      <TopHeader title="Dotations EPI" />
      <div className="flex-1 p-7 animate-fade">
        <DotationsClient />
      </div>
    </>
  );
}

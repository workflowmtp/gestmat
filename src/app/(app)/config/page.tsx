import TopHeader from '@/components/layout/TopHeader';
import ConfigClient from '@/components/config/ConfigClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ConfigPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      <TopHeader title="Configuration" />
      <div className="flex-1 p-7 animate-fade">
        <ConfigClient />
      </div>
    </>
  );
}

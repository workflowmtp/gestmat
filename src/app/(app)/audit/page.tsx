import TopHeader from '@/components/layout/TopHeader';
import AuditClient from '@/components/audit/AuditClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuditPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      <TopHeader title="Journal d'audit" />
      <div className="flex-1 p-7 animate-fade">
        <AuditClient />
      </div>
    </>
  );
}

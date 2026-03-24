import TopHeader from '@/components/layout/TopHeader';
import CampaignsClient from '@/components/campaigns/CampaignsClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function CampaignsPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      <TopHeader title="Inventaires physiques" />
      <div className="flex-1 p-7 animate-fade">
        <CampaignsClient />
      </div>
    </>
  );
}

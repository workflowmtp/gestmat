import TopHeader from '@/components/layout/TopHeader';
import InventoryClient from '@/components/items/InventoryClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function InventoryPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      <TopHeader title="Inventaire général" />
      <div className="flex-1 p-7 animate-fade">
        <InventoryClient />
      </div>
    </>
  );
}

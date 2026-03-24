import TopHeader from '@/components/layout/TopHeader';
import ItemDetailClient from '@/components/items/ItemDetailClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  return (
    <>
      <TopHeader title="Fiche article" />
      <div className="flex-1 p-7 animate-fade">
        <ItemDetailClient itemId={id} />
      </div>
    </>
  );
}

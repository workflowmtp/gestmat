import TopHeader from '@/components/layout/TopHeader';
import ItemForm from '@/components/items/ItemForm';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function NewItemPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      <TopHeader title="Nouvel article" />
      <div className="flex-1 p-7 animate-fade">
        <ItemForm />
      </div>
    </>
  );
}

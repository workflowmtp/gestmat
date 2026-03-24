export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-txt-secondary">Chargement...</p>
      </div>
    </div>
  );
}

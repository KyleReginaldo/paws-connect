export default function LoadingPetDetail() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded mb-2" />
      <div className="h-4 w-24 bg-muted rounded mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="relative aspect-square rounded-lg border bg-muted" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {[...Array(6)].map((_, i) => (
          <span key={i} className="h-6 w-24 bg-muted rounded-full" />
        ))}
      </div>
      <div className="h-5 w-32 bg-muted rounded mb-2" />
      <div className="h-20 w-full bg-muted rounded" />
    </div>
  );
}

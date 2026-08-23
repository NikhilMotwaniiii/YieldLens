export default function Loading() {
  return (
    <main className="min-h-screen bg-paper px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-24 animate-pulse rounded-md bg-night" />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-md bg-panel" />
          ))}
        </div>
      </div>
    </main>
  );
}

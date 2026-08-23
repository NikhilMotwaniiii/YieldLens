"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="max-w-md rounded-md border border-line bg-panel p-6 text-center shadow-panel">
        <h1 className="text-xl font-semibold text-ink">Unable to load portfolio analytics.</h1>
        <p className="mt-2 text-sm text-muted">Try again.</p>
        <Button className="mt-5" onClick={reset}>
          Retry
        </Button>
      </div>
    </main>
  );
}

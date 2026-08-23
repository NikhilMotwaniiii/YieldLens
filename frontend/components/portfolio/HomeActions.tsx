"use client";

import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createPortfolio, ensureDemoPortfolio } from "@/lib/api/portfolios";

export function HomeActions() {
  const router = useRouter();
  const [busy, setBusy] = useState<"demo" | "create" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openDemo() {
    setBusy("demo");
    setError(null);
    try {
      const portfolio = await ensureDemoPortfolio();
      router.push(`/portfolio/${portfolio.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open demo portfolio");
    } finally {
      setBusy(null);
    }
  }

  async function createBlank() {
    setBusy("create");
    setError(null);
    try {
      const portfolio = await createPortfolio("New Bond Workspace");
      router.push(`/portfolio/${portfolio.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create portfolio");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-9">
      <div className="flex flex-wrap gap-3">
        <Button className="h-11 px-5" onClick={openDemo} disabled={busy !== null}>
          <Search size={17} />
          {busy === "demo" ? "Opening..." : "Explore Demo Portfolio"}
        </Button>
        <Button className="h-11 px-5" variant="secondary" onClick={createBlank} disabled={busy !== null}>
          <Plus size={17} />
          {busy === "create" ? "Creating..." : "Create Portfolio"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-loss">{error}</p> : null}
    </div>
  );
}

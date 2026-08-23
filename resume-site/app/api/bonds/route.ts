import { bonds } from "@/lib/bonds";
import { json, preflight } from "@/lib/api-utils";

export const OPTIONS = preflight;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const filtered = query
    ? bonds.filter((bond) =>
        [bond.isin, bond.issuer, bond.securityName, bond.rating, bond.sector].some((value) =>
          String(value).toLowerCase().includes(query)
        )
      )
    : bonds;

  return json({ bonds: filtered.slice(0, 24) });
}

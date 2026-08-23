import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portfolios, positions } from "@/db/schema";
import { badRequest, clientIdFrom, json, numeric, preflight, readJson, serverError } from "@/lib/api-utils";
import { findBond } from "@/lib/bonds";

export const OPTIONS = preflight;

type AddPositionPayload = {
  isin?: string;
  units?: number;
  purchasePrice?: number;
  currentPrice?: number;
  purchaseDate?: string;
};

async function ownsPortfolio(request: Request, portfolioId: number) {
  const db = getDb();
  const [portfolio] = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.clientId, clientIdFrom(request))))
    .limit(1);
  return portfolio;
}

export async function GET(request: Request, context: { params: Promise<{ portfolioId: string }> }) {
  try {
    const params = await context.params;
    const portfolioId = Number(params.portfolioId);
    if (!Number.isInteger(portfolioId)) return badRequest("Invalid portfolio id.");
    const portfolio = await ownsPortfolio(request, portfolioId);
    if (!portfolio) return json({ portfolio: null, positions: [] });

    const db = getDb();
    const rows = await db.select().from(positions).where(eq(positions.portfolioId, portfolioId));
    return json({ portfolio, positions: rows });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ portfolioId: string }> }) {
  try {
    const params = await context.params;
    const portfolioId = Number(params.portfolioId);
    if (!Number.isInteger(portfolioId)) return badRequest("Invalid portfolio id.");

    const portfolio = await ownsPortfolio(request, portfolioId);
    if (!portfolio) return badRequest("Portfolio not found.");

    const payload = await readJson<AddPositionPayload>(request);
    const isin = payload.isin?.trim().toUpperCase() ?? "";
    const bond = findBond(isin);
    if (!bond) return badRequest("Choose a valid demo bond.");

    const units = numeric(payload.units);
    const purchasePrice = numeric(payload.purchasePrice, bond.faceValue);
    const currentPrice = numeric(payload.currentPrice, bond.price);
    if (!units || units <= 0) return badRequest("Units must be greater than zero.");
    if (!purchasePrice || purchasePrice <= 0) return badRequest("Purchase price must be greater than zero.");
    if (!currentPrice || currentPrice <= 0) return badRequest("Current price must be greater than zero.");

    const db = getDb();
    const [position] = await db
      .insert(positions)
      .values({
        portfolioId,
        isin,
        units,
        purchasePrice,
        currentPrice,
        purchaseDate: payload.purchaseDate?.trim() || null,
      })
      .returning();

    await db
      .update(portfolios)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(portfolios.id, portfolioId));

    return json({ position }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

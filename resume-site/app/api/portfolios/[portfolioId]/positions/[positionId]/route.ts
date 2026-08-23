import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portfolios, positions } from "@/db/schema";
import { badRequest, clientIdFrom, json, notFound, preflight, serverError } from "@/lib/api-utils";

export const OPTIONS = preflight;

export async function DELETE(
  request: Request,
  context: { params: Promise<{ portfolioId: string; positionId: string }> }
) {
  try {
    const params = await context.params;
    const portfolioId = Number(params.portfolioId);
    const positionId = Number(params.positionId);
    if (!Number.isInteger(portfolioId) || !Number.isInteger(positionId)) {
      return badRequest("Invalid position id.");
    }

    const db = getDb();
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.clientId, clientIdFrom(request))))
      .limit(1);
    if (!portfolio) return notFound("Portfolio not found.");

    await db.delete(positions).where(and(eq(positions.id, positionId), eq(positions.portfolioId, portfolioId)));
    await db
      .update(portfolios)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(portfolios.id, portfolioId));

    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}

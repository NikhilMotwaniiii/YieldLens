import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portfolios, positions } from "@/db/schema";
import { badRequest, clientIdFrom, json, notFound, preflight, readJson, serverError } from "@/lib/api-utils";

export const OPTIONS = preflight;

type RenamePayload = {
  name?: string;
};

function portfolioIdFrom(params: { portfolioId: string }) {
  return Number(params.portfolioId);
}

export async function PATCH(request: Request, context: { params: Promise<{ portfolioId: string }> }) {
  try {
    const params = await context.params;
    const id = portfolioIdFrom(params);
    if (!Number.isInteger(id)) return badRequest("Invalid portfolio id.");

    const payload = await readJson<RenamePayload>(request);
    const name = payload.name?.trim() ?? "";
    if (name.length < 2) return badRequest("Portfolio name must be at least 2 characters.");
    if (name.length > 120) return badRequest("Portfolio name is too long.");

    const db = getDb();
    const [portfolio] = await db
      .update(portfolios)
      .set({ name, updatedAt: new Date().toISOString() })
      .where(and(eq(portfolios.id, id), eq(portfolios.clientId, clientIdFrom(request))))
      .returning();

    if (!portfolio) return notFound("Portfolio not found.");
    return json({ portfolio });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ portfolioId: string }> }) {
  try {
    const params = await context.params;
    const id = portfolioIdFrom(params);
    if (!Number.isInteger(id)) return badRequest("Invalid portfolio id.");

    const db = getDb();
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, id), eq(portfolios.clientId, clientIdFrom(request))))
      .limit(1);
    if (!portfolio) return notFound("Portfolio not found.");

    await db.delete(positions).where(eq(positions.portfolioId, id));
    await db.delete(portfolios).where(eq(portfolios.id, id));
    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}

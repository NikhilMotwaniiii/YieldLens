import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portfolios } from "@/db/schema";
import { badRequest, clientIdFrom, readJson, serverError } from "@/lib/api-utils";

type CreatePortfolioPayload = {
  name?: string;
};

export async function GET(request: Request) {
  try {
    const clientId = clientIdFrom(request);
    const db = getDb();
    const rows = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.clientId, clientId))
      .orderBy(desc(portfolios.updatedAt), desc(portfolios.id));
    return Response.json({ portfolios: rows });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const clientId = clientIdFrom(request);
    const payload = await readJson<CreatePortfolioPayload>(request);
    const name = payload.name?.trim() || "New Bond Workspace";
    if (name.length > 120) return badRequest("Portfolio name is too long.");

    const db = getDb();
    const [portfolio] = await db
      .insert(portfolios)
      .values({ clientId, name })
      .returning();
    return Response.json({ portfolio }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

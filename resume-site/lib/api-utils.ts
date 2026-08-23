export function clientIdFrom(request: Request) {
  const raw = request.headers.get("x-yieldlens-client") ?? "";
  return raw.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "anonymous";
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-yieldlens-client",
};

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers,
    },
  });
}

export function preflight() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return json({ error: message }, { status: 404 });
}

export function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  return json({ error: message }, { status: 500 });
}

export function numeric(value: unknown, fallback: number | null = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

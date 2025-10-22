import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

// Common forwarder
async function forward(req: NextRequest, method: string, path: string[]) {
  if (!API_BASE) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const target = `${API_BASE}/${path.join("/")}${req.nextUrl.search}`;

  // Build headers
  const headers = new Headers();
  // Pass auth header if present
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  headers.set("accept", req.headers.get("accept") || "application/json");
  // Only set content-type if we forward a body
  const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // Get body if needed (stream for large payloads; here we keep it simple)
  let body: BodyInit | null = null;
  if (hasBody) {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await req.json().catch(() => null);
      headers.set("content-type", "application/json");
      body = JSON.stringify(json ?? {});
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      const params = new URLSearchParams();
      for (const [k, v] of form.entries()) params.append(k, String(v));
      headers.set("content-type", "application/x-www-form-urlencoded");
      body = params.toString();
    } else {
      // fallback: raw body
      const buf = await req.arrayBuffer().catch(() => null);
      if (buf) body = buf;
      const ct = req.headers.get("content-type");
      if (ct) headers.set("content-type", ct);
    }
  }

  const resp = await fetch(target, { method, headers, body, cache: "no-store" });

  // Pass through response as-is
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "content-type": resp.headers.get("content-type") || "application/json",
    },
  });
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, "GET", ctx.params.path);
}

export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, "POST", ctx.params.path);
}

export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, "PUT", ctx.params.path);
}

export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, "PATCH", ctx.params.path);
}

export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, "DELETE", ctx.params.path);
}

// Handle preflight if browser sends it to the proxy
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "authorization,content-type",
    },
  });
}
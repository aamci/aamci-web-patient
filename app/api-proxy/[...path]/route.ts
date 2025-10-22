import { NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/,"");

async function forward(req: Request, method: string, path: string[]) {
  if (!API_BASE) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const target = `${API_BASE}/${path.join("/")}${new URL(req.url).search}`;

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  headers.set("accept", req.headers.get("accept") || "application/json");

  const hasBody = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
  let body: BodyInit | null = null;

  if (hasBody) {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const json = await req.json().catch(() => null);
      headers.set("content-type", "application/json");
      body = JSON.stringify(json ?? {});
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      const params = new URLSearchParams();
      for (const [k, v] of form.entries()) params.append(k, String(v));
      headers.set("content-type", "application/x-www-form-urlencoded");
      body = params.toString();
    } else {
      const buf = await req.arrayBuffer().catch(() => null);
      if (buf) body = Buffer.from(buf);
      if (ct) headers.set("content-type", ct);
    }
  }

  const resp = await fetch(target, { method, headers, body, cache: "no-store" });
  const text = await resp.text();

  return new NextResponse(text, {
    status: resp.status,
    headers: { "content-type": resp.headers.get("content-type") || "application/json" },
  });
}

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, "GET", path);
}

export async function POST(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, "POST", path);
}

export async function PUT(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, "PUT", path);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, "PATCH", path);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, "DELETE", path);
}

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
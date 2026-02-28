import { NextRequest, NextResponse } from "next/server";

const POKEWALLET_IMAGES = "https://api.pokewallet.io/images";

export async function GET(request: NextRequest) {
  const apiKey = process.env.POKEWALLET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "PokeWallet API not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const size = searchParams.get("size") === "high" ? "high" : "low";
  if (!id || !id.trim()) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const url = `${POKEWALLET_IMAGES}/${encodeURIComponent(id.trim())}?size=${size}`;
  try {
    const res = await fetch(url, {
      headers: { "X-API-Key": apiKey },
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Image not found" }, { status: res.status === 404 ? 404 : 502 });
    }
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}

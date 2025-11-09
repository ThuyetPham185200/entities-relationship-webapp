import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id1 = searchParams.get("entity_one") || "";
  const id2 = searchParams.get("entity_two") || "";

  if (!id1 || !id2) {
    return NextResponse.json(
      { error: "Missing required parameters: entity_one or entity_two" },
      { status: 400 }
    );
  }

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL2 || "http://localhost:8080";
  const url = `${backend}/api/v1/srp/search?entity_one=${encodeURIComponent(id1)}&entity_two=${encodeURIComponent(id2)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    // ✅ Print data for debugging
    console.log("📦 Backend response:", JSON.stringify(data, null, 2));

    // Forward status code from backend
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("❌ Proxy error:", err);
    return NextResponse.json(
      {
        error: "Failed to connect to backend",
        detail: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

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

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  const url = `${backend}/api/v1/srp/search?entity_one=${encodeURIComponent(id1)}&entity_two=${encodeURIComponent(id2)}`;

  try {
    const res = await fetch(url);
    const body = await res.json();

    console.log("📦 Backend response:", JSON.stringify(body, null, 2));

    // Extract only "data" field
    const extracted = body.data;

    return NextResponse.json(extracted, { status: res.status });
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

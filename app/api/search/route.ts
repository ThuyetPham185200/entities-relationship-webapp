import { NextResponse } from "next/server";

export async function GET(req: Request) {
    
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  try {
    const res = await fetch(`${backend}/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { error: "Failed to connect to backend", detail: String(err) },
      { status: 500 }
    );
  }
}

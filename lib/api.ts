// lib/api.ts
// Calls the Next.js API route `/api/search` which proxies to the backend.

export async function searchEntities(keyword: string, size: number = 5) {
  try {

    const res = await fetch(`/api/v1/et/search?keyword=${encodeURIComponent(keyword)}&size=${size}`);

    if (!res.ok) {
      let msg = `Failed to search entities (status ${res.status})`;
      try {
        const body = await res.json();
        if (body && body.error) msg += `: ${body.error}`;
      } catch (_) {}
      throw new Error(msg);
    }

    const data = await res.json();

    // ✅ Debug log: see exactly what backend sends
    console.log("📦 Raw data from server:", data);

    // Normalize response to consistent UI shape
    const mapItem = (item: any) => {
      if (typeof item === "string") {
        return { id: item, title: item, description: "" };
      }
      const title = item.title || item.name || item.label || String(item);
      const id = item.id || item.key || title;
      const description = item.description || item.summary || item.snippet || "";
      return { id, title, description };
    };

    if (Array.isArray(data)) return data.map(mapItem);

    const arr =
      data?.results ||
      data?.items ||
      data?.data ||
      data?.names ||
      null;

    if (Array.isArray(arr)) return arr.map(mapItem);

    console.warn("searchEntities: unexpected response shape", data);
    return [];
  } catch (err: any) {
    throw new Error(`searchEntities: ${err?.message || String(err)}`);
  }
}

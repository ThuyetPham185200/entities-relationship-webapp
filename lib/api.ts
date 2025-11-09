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


export interface WebsocketInfo {
  ip: string;
  port: string;
}

export interface SPProcessResult {
  request_id: string;
  websocket_server_info: WebsocketInfo;
  status: string;
}

export async function searchRelationship(id1: string, id2: string): Promise<SPProcessResult> {
  try {
    const res = await fetch(
      `/api/v1/srp/search?entity_one=${encodeURIComponent(id1)}&entity_two=${encodeURIComponent(id2)}`
    );

    if (!res.ok) {
      let msg = `Failed to search relationship (status ${res.status})`;
      try {
        const body = await res.json();
        if (body && body.error) msg += `: ${body.error}`;
      } catch (_) {}
      throw new Error(msg);
    }

    const data = await res.json();

    // ✅ Debug log to see exactly what server sends
    console.log("📦 Raw SPProcessResult from server:", data);

    // ✅ Type guard / normalization
    if (
      typeof data === "object" &&
      data !== null &&
      "request_id" in data &&
      "websocket_server_info" in data
    ) {
      const info = data.websocket_server_info || {};
      return {
        request_id: String(data.request_id),
        websocket_server_info: {
          ip: String(info.ip || ""),
          port: String(info.port || ""),
        },
        status: String(data.status || ""),
      };
    }

    console.warn("searchRelationship: unexpected response shape", data);
    throw new Error("Invalid response shape from server");
  } catch (err: any) {
    throw new Error(`searchRelationship: ${err?.message || String(err)}`);
  }
}

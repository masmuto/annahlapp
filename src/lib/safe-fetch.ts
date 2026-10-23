// Safe fetch helper for client-side API calls.
// Handles: empty body, non-JSON response, network errors, timeouts.

interface SafeFetchResult<T> {
  ok: boolean;
  data: T | null;
  error: string;
  status: number;
}

/**
 * Fetch with safe JSON parsing.
 * - Timeout: 30s default
 * - Returns { ok, data, error, status } instead of throwing
 * - If response body is empty or non-JSON, returns error message instead of throwing
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30000
): Promise<SafeFetchResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    // Read body as text first, then try to parse
    const text = await res.text();

    if (!text || text.trim() === "") {
      return {
        ok: false,
        data: null,
        error: `Server mengembalikan response kosong (HTTP ${res.status}). Mungkin terjadi error di server — cek dev.log.`,
        status: res.status,
      };
    }

    try {
      const data = JSON.parse(text) as T;
      return {
        ok: res.ok,
        data,
        error: "",
        status: res.status,
      };
    } catch (parseErr) {
      // Response is not JSON — probably HTML error page or plain text
      const preview = text.slice(0, 200);
      return {
        ok: false,
        data: null,
        error: `Response bukan JSON valid (HTTP ${res.status}). Preview: ${preview}`,
        status: res.status,
      };
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return {
        ok: false,
        data: null,
        error: `Request timeout setelah ${timeoutMs / 1000}s. Server terlalu lama merespons.`,
        status: 0,
      };
    }
    return {
      ok: false,
      data: null,
      error: `Network error: ${err?.message || String(err)}`,
      status: 0,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

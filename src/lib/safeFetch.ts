export async function safeFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    console.warn(`Network fetch error accessing ${url}:`, netErr?.message || netErr);
    throw new Error(`Network error accessing ${url}: ${netErr.message || 'Unable to connect to server'}`);
  }

  const contentType = res.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    let data: any = null;
    try {
      data = await res.json();
    } catch (parseErr: any) {
      throw new Error(`Failed to parse response JSON from server for ${url}.`);
    }

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `Request failed (${res.status} ${res.statusText})`;
      throw new Error(errorMsg);
    }

    return (data !== null ? data : {}) as T;
  } else {
    // Attempt to parse text or JSON fallback
    let text = '';
    try {
      text = await res.text();
      const parsed = JSON.parse(text);
      if (parsed) {
        if (!res.ok) {
          throw new Error(parsed.error || parsed.message || `Request failed (${res.status})`);
        }
        return parsed as T;
      }
    } catch (e) {
      // Ignore text JSON parse failure
    }

    if (!res.ok) {
      const textPreview = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
      throw new Error(
        `API endpoint ${url} returned error (${res.status} ${res.statusText}). ${textPreview ? `(${textPreview})` : ''}`
      );
    }

    return {} as T;
  }
}

export async function parseJsonResponse<T = any>(res: Response): Promise<T> {
  return safeFetch(res.url);
}


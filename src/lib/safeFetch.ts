export async function safeFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error(`Network error: ${netErr.message || 'Unable to connect to server'}`);
  }

  const contentType = res.headers.get('content-type') || '';
  
  if (!contentType.includes('application/json')) {
    // If an HTML fallback page or non-JSON text was returned
    let textPreview = '';
    try {
      const text = await res.text();
      textPreview = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
    } catch (e) {}

    throw new Error(
      `API endpoint returned non-JSON response (HTML). ` +
      `Ensure backend functions are deployed or backend server is running. ${textPreview ? `(${textPreview})` : ''}`
    );
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch (parseErr: any) {
    throw new Error('Failed to parse response JSON from server.');
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Request failed (${res.status} ${res.statusText})`;
    throw new Error(errorMsg);
  }

  return (data !== null ? data : {}) as T;
}

export async function parseJsonResponse<T = any>(res: Response): Promise<T> {
  return safeFetch(res.url);
}

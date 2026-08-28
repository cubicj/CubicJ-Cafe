export class ApiError extends Error {
  constructor(
    public status: number,
    public errorMessage: string,
  ) {
    super(errorMessage);
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const text = await res.text();

  if (!res.ok) {
    let errorMessage = text.trim() || `HTTP ${res.status}`;
    if (text.trim()) {
      try {
        const body = JSON.parse(text) as { error?: unknown; details?: unknown };
        const detailMessages = Array.isArray(body.details)
          ? body.details
              .map((detail) =>
                typeof detail === 'object' && detail !== null && 'message' in detail
                  ? detail.message
                  : undefined,
              )
              .filter(
                (message): message is string =>
                  typeof message === 'string' && message.trim().length > 0,
              )
          : [];
        const uniqueDetailMessages = [...new Set(detailMessages)];
        if (uniqueDetailMessages.length > 0) {
          errorMessage = uniqueDetailMessages.join(', ');
        } else if (typeof body.error === 'string' && body.error.trim()) {
          errorMessage = body.error;
        }
      } catch {
        errorMessage = text;
      }
    }
    throw new ApiError(res.status, errorMessage);
  }

  if (res.status === 204 || !text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
  postFormData: <T>(url: string, formData: FormData) =>
    request<T>(url, { method: 'POST', body: formData }),
  putFormData: <T>(url: string, formData: FormData) =>
    request<T>(url, { method: 'PUT', body: formData }),
};

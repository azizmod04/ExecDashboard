const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string) =>
      request<{ access_token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<any>('/auth/me'),
  },
  upload: {
    file: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<any>('/upload/', { method: 'POST', body: form });
    },
  },
  dashboards: {
    list: () => request<any[]>('/dashboards/'),
    get: (id: string) => request<any>(`/dashboards/${id}`),
    delete: (id: string) =>
      request<any>(`/dashboards/${id}`, { method: 'DELETE' }),
  },
  insights: {
    analyze: (dashboard_id: string, lang = 'ar') =>
      request<any>('/insights/analyze', {
        method: 'POST',
        body: JSON.stringify({ dashboard_id, lang }),
      }),
    ask: (dashboard_id: string, question: string, lang = 'ar') =>
      request<{ question: string; answer: string }>('/insights/ask', {
        method: 'POST',
        body: JSON.stringify({ dashboard_id, question, lang }),
      }),
  },
  shares: {
    list: () => request<any[]>('/shares/'),
    create: (data: any) =>
      request<any>('/shares/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/shares/${id}`, { method: 'DELETE' }),
    getPublic: (id: string) => request<any>(`/shares/public/${id}`),
  },
  health: () => request<any>('/health'),
};

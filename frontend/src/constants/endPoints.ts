export const API_ENDPOINTS = {
  auth: { register: '/auth/register', login: '/auth/login', me: '/auth/me' },
  readings: { list: '/readings', one: (id: string) => `/readings/${encodeURIComponent(id)}` },
  reports: { byType: (type: string) => `/reports/${type}` },
} as const;

export const PUBLIC_AUTH_ENDPOINTS: string[] = [API_ENDPOINTS.auth.login, API_ENDPOINTS.auth.register];

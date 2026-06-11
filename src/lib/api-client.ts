const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  const response = await fetch(url, options);
  return response;
}

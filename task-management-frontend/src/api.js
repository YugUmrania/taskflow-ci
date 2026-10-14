const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export { API_BASE };

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, onActivity } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    onActivity?.({ method, path, status: 0, ok: false });
    throw new ApiError(
      `Cannot reach the API at ${API_BASE} - is the backend running (npm run dev)?`,
      0
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // empty body
  }

  onActivity?.({ method, path, status: response.status, ok: response.ok });

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      data?.details?.join(', ') ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data;
}

// Task endpoints
export const getTasks = (options = {}) => request('/tasks', { ...options, method: 'GET' });

export const createTask = (body, options = {}) =>
  request('/tasks', { ...options, method: 'POST', body });

export const updateTask = (id, body, options = {}) =>
  request(`/tasks/${id}`, { ...options, method: 'PUT', body });

export const deleteTask = (id, options = {}) =>
  request(`/tasks/${id}`, { ...options, method: 'DELETE' });

// Practical 13 - AI description generation (server-side API key, never in the browser)
export const generateDescription = (title, options = {}) =>
  request('/api/ai/generate-description', { ...options, method: 'POST', body: { title } });

// Health check used for the "Backend" status pill
export const pingBackend = (options = {}) => request('/health', { ...options, method: 'GET' });

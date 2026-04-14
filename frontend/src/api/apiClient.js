const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getToken = () => localStorage.getItem('emap_token');

const headers = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/** @param {Response} res */
const handleResponse = async (res) => {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch {
      // response was not JSON (e.g. HTML error page)
    }
    throw new Error(message);
  }
  return res.json();
};

// AUTH
export const auth = {
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) localStorage.setItem('emap_token', data.token);
    return data;
  },
  register: async (email, password, name) => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ email, password, name })
    });
    const data = await handleResponse(res);
    if (data.token) localStorage.setItem('emap_token', data.token);
    return data;
  },
  registerAdmin: async (email, password, name, secretKey) => {
    const res = await fetch(`${BASE_URL}/api/auth/register-admin`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ email, password, name, secretKey })
    });
    const data = await handleResponse(res);
    if (data.token) localStorage.setItem('emap_token', data.token);
    return data;
  },
  me: async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: headers() });
    return handleResponse(res);
  },
  updateMe: async (updates) => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'PATCH', headers: headers(),
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },
  isAuthenticated: () => !!getToken(),
  logout: () => { localStorage.removeItem('emap_token'); window.location.href = '/'; },
  redirectToLogin: (returnUrl) => { window.location.href = `/AdminLogin?return=${encodeURIComponent(returnUrl || '/')}`; }
};

// REPORTS
export const reports = {
  create: async (data) => {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST', headers: headers(), body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/api/reports/${id}`, { headers: headers() });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/api/reports/${id}`, {
      method: 'PATCH', headers: headers(), body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  listAll: async () => {
    const res = await fetch(`${BASE_URL}/api/reports`, { headers: headers() });
    return handleResponse(res);
  },
  listMy: async () => {
    const res = await fetch(`${BASE_URL}/api/reports/my`, { headers: headers() });
    return handleResponse(res);
  },
  listVerified: async () => {
    const res = await fetch(`${BASE_URL}/api/reports/verified`, { headers: headers() });
    return handleResponse(res);
  }
};

// EMERGENCY CONTACTS
export const contacts = {
  list: async () => {
    const res = await fetch(`${BASE_URL}/api/contacts`, { headers: headers() });
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${BASE_URL}/api/contacts`, {
      method: 'POST', headers: headers(), body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/api/contacts/${id}`, {
      method: 'PATCH', headers: headers(), body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};

// AI
export const ai = {
  getSuggestions: async (prompt) => {
    const res = await fetch(`${BASE_URL}/api/ai/suggest`, {
      method: 'POST', headers: headers(), body: JSON.stringify({ prompt })
    });
    return handleResponse(res);
  },
  triggerCall: async (reportId) => {
    const res = await fetch(`${BASE_URL}/api/ai/call/${reportId}`, {
      method: 'POST', headers: headers()
    });
    return handleResponse(res);
  }
};

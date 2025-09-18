const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// API configuration
export const api = {
  baseURL: API_URL,
  endpoints: {
    auth: {
      register: "/auth/register",
      login: "/auth/login",
    },
    products: {
      list: "/products/",
      create: "/products/",
      get: (id: string) => `/products/${id}`,
      search: "/products/search",
      addImage: (id: string) => `/products/${id}/images`,
    },
    designs: {
      upload: "/designs/upload",
      list: "/designs/",
    },
  },
};

// API helper functions
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem("access_token");

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  const text = await response.text();
  let body: any = undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch (err) {
    body = text;
  }

  if (!response.ok) {
    // Try to extract a helpful message from the body
    const detail =
      body && (body.detail || body.message || body.error)
        ? body.detail || body.message || body.error
        : body;
    const msg = `API Error: ${response.status}${
      detail ? ` - ${JSON.stringify(detail)}` : ""
    }`;
    const e: any = new Error(msg);
    e.status = response.status;
    e.body = body;
    throw e;
  }

  return body;
};

export const uploadFile = async (endpoint: string, formData: FormData) => {
  const token = localStorage.getItem("access_token");

  const config: RequestInit = {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    throw new Error(`Upload Error: ${response.status}`);
  }

  return response.json();
};

export const uploadImage = async (formData: FormData) => {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}/uploadimage`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload Image Error: ${response.status} - ${text}`);
  }

  return response.json();
};

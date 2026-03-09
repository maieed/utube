const base = String(import.meta.env.VITE_API_URL || "http://localhost:4000").trim().replace(/\/+$/, "");

export const API_BASE = base;

const safeJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
};

export const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, options);
  const json = await safeJson(response);
  if (!response.ok) {
    throw new Error(json.error || `Request failed (${response.status})`);
  }
  return json;
};

export const resolveMediaUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url}`;
};

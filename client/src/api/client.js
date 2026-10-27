// One shared axios instance. Every API call in the app goes through this file.
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
});

const getToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

// Called when the server says our login is no longer valid (expired token).
// store.js registers a function here that logs the user out.
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// Attach the JWT token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthForm = url.startsWith("/auth/login") || url.startsWith("/auth/register");
    // A 401 on the login form just means "wrong password", not "session expired"
    if (error.response?.status === 401 && !isAuthForm && onUnauthorized) onUnauthorized();
    return Promise.reject(error);
  }
);

export default api;

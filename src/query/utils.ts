const env = import.meta.env;
// remove the trailing slash from the URL if it exists
export const API_BASE_URL = env.VITE_API_BASE_URL?.endsWith("/")
  ? env.VITE_API_BASE_URL.slice(0, -1)
  : env.VITE_API_BASE_URL;

import Axios from "axios";

const env = import.meta.env;
// remove the trailing slash from the URL if it exists
const API_BASE_URL = env.VITE_API_BASE_URL?.endsWith("/")
  ? env.VITE_API_BASE_URL.slice(0, -1)
  : env.VITE_API_BASE_URL;

export const axios = Axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

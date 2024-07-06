import Axios from "axios";
import { API_BASE_URL } from "./utils";

export const axios = Axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

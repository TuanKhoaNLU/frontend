import axios from "axios";
import { getAccessToken } from "../features/auth/tokenStorage";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

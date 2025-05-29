import axios from "axios";

const api = axios.create({
  // Use relative path if in production, otherwise localhost
  baseURL: process.env.NODE_ENV === 'production' ? '' : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
});

export default api;

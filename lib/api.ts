import axios from "axios";
console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : "http://localhost:5000",
  withCredentials: true,
});

export default api;

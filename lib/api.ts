import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
});

// Add response interceptor to handle cookie updates
api.interceptors.response.use(response => {
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    // Handle any cookie-related logic if needed
    console.log('Received new cookies');
  }
  return response;
});

export default api;

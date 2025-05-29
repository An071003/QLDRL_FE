import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies are sent with every request
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Add response interceptor to handle cookie updates
api.interceptors.response.use(
  (response) => {
    // Check for and handle any cookie updates in response headers
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      console.log('Received new cookies from server');
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

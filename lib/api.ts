import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        withCredentials: config.withCredentials
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Response:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          console.error('Unauthorized access');
          break;
        case 403:
          // Handle forbidden
          console.error('Forbidden access');
          break;
        case 500:
          // Handle server error
          console.error('Server error');
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

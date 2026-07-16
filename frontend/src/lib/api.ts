import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 8000, // 8 seconds timeout to prevent hanging requests
});

let isRefreshing = false;
let failedRequestsQueue: any[] = [];

const processQueue = (error: any) => {
  failedRequestsQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedRequestsQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('[API Interceptor] Error details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    const originalRequest = error.config;

    // If response status is 401 and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the failed request was an onboarding/login endpoint or the refresh endpoint itself, reject immediately
      const skipRefreshUrls = [
        '/auth/login',
        '/auth/register',
        '/auth/verify-otp',
        '/auth/send-otp',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/refresh'
      ];
      if (skipRefreshUrls.some(url => originalRequest.url?.includes(url))) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        isRefreshing = false;
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);

        // Trigger a logout event so AuthContext can clean up the state
        window.dispatchEvent(new Event('auth-logout'));

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

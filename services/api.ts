import axios from 'axios';
import { Config } from '@/constants/config';

const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  // In a real app, add auth token here
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // In a real app, handle 401, refresh tokens, etc.
    return Promise.reject(error);
  }
);

export function simulateDelay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default apiClient;

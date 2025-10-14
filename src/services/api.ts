import axios from 'axios';

// Create a new axios instance
const api = axios.create({
  baseURL: 'https://saas-platform-backend.onrender.com/api'
});

// Use an interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const rotateImage = async (imageId: string, angle: number) => {
  const response = await api.put(`/images/${imageId}/rotate`, { angle });
  return response.data;
};


export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Role & user info — will be replaced by Member 1's JWT auth later
let currentRole = localStorage.getItem('mockRole') || '';
let currentUserId = localStorage.getItem('mockUserId') || '';

export const setRole = (role) => {
  currentRole = role;
  localStorage.setItem('mockRole', role);
};

export const getRole = () => currentRole;

export const setUserId = (id) => {
  currentUserId = id;
  localStorage.setItem('mockUserId', id);
};

export const getUserId = () => currentUserId;

api.interceptors.request.use((config) => {
  const mockUser = {
    userId: currentUserId,
    role: currentRole,
  };
  config.headers['x-mock-user'] = JSON.stringify(mockUser);
  return config;
});

export default api;

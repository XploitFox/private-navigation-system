import api from './api';

export const AuthService = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  refreshToken: async () => {
      const response = await api.post('/auth/refresh');
      return response.data;
  }
};

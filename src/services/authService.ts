import api from './api';

export interface AuthTokensResponse {
  accessToken: string;
  expiresIn: number;
}

export const AuthService = {
  login: async (credentials: { key: string }): Promise<AuthTokensResponse> => {
    const response = await api.post<AuthTokensResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },
  
  refreshToken: async (): Promise<AuthTokensResponse> => {
    const response = await api.post<AuthTokensResponse>('/auth/refresh');
    return response.data;
  },
};

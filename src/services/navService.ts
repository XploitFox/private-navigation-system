import api from './api';

export interface NavigationItem {
  id: string;
  title: string;
  url: string;
  description: string;
  favicon?: string;
  sort_order: number;
}

export interface NavigationCategory {
  id: string;
  name: string;
  icon?: string;
  sort_order: number;
  items: NavigationItem[];
}

export const NavService = {
  getAll: async () => {
    const response = await api.get('/navigations');
    return response.data;
  },

  update: async (categories: NavigationCategory[]) => {
    const response = await api.post('/navigations', { categories });
    return response.data;
  },
};

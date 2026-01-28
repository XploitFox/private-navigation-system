import { JSONFileStore } from '../utils/jsonStore.js';

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

interface NavigationData {
  navigations: NavigationCategory[];
}

const defaultNavigations: NavigationCategory[] = [
  {
    id: 'dev',
    name: 'Development',
    icon: 'code',
    sort_order: 1,
    items: [
      {
        id: 'github',
        title: 'GitHub',
        url: 'https://github.com',
        description: 'Where the world builds software',
        sort_order: 1,
      },
      {
        id: 'stackoverflow',
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        description: 'Developer community',
        sort_order: 2,
      },
    ],
  },
  {
    id: 'tools',
    name: 'Tools',
    icon: 'tool',
    sort_order: 2,
    items: [
      {
        id: 'chatgpt',
        title: 'ChatGPT',
        url: 'https://chat.openai.com',
        description: 'AI Assistant',
        sort_order: 1,
      },
    ],
  },
];

const navStore = new JSONFileStore<NavigationData>('navigations.json', {
  navigations: defaultNavigations,
});

export const NavModel = {
  async getAll(): Promise<NavigationCategory[]> {
    const data = await navStore.read();
    // Ensure we always return an array, even if data is malformed
    return data?.navigations || [];
  },

  async saveAll(categories: NavigationCategory[]): Promise<void> {
    await navStore.write({ navigations: categories });
  },
};

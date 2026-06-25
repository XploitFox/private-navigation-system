import api from './api';

export const MetaService = {
  get: async (
    url: string,
    opts?: { signal?: AbortSignal; timeoutMs?: number }
  ): Promise<{ title: string; description: string; favicon?: string }> => {
    const response = await api.get('/meta', {
      params: { url },
      signal: opts?.signal,
      timeout: opts?.timeoutMs,
    });
    return response.data;
  },
};

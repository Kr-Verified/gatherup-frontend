import api from '@/lib/api';

export interface ScheduleResponse {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  title: string;
  color: string | null;
  createdAt: string;
}

export const scheduleService = {
  list: async (): Promise<ScheduleResponse[]> => {
    const { data } = await api.get('/api/schedules');
    return data;
  },
  create: async (startDate: string, endDate: string, title: string, color?: string): Promise<ScheduleResponse> => {
    const { data } = await api.post('/api/schedules', { startDate, endDate, title, color });
    return data;
  },
  importMany: async (schedules: Array<{ startDate: string; endDate: string; title: string; color?: string }>): Promise<{ importedCount: number }> => {
    const { data } = await api.post('/api/schedules/import', { schedules });
    return data;
  },
  update: async (id: string, payload: Partial<{ startDate: string; endDate: string; title: string; color: string }>): Promise<ScheduleResponse> => {
    const { data } = await api.put(`/api/schedules/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/schedules/${id}`);
  },
};

import api from '@/lib/api';

export interface RoomResponse {
  id: string;
  name: string;
  inviteCode: string;
  hasPassword: boolean;
  createdAt: string;
  creatorId: string;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  user: { nickname: string };
}

export interface RoomDetail {
  room: RoomResponse;
  members: RoomMember[];
}

export interface DateAvailability {
  date: string;
  availableCount: number;
  totalCount: number;
  status: 'all-free' | 'some-busy' | 'all-busy';
  busyMembers: string[];
}

export const roomService = {
  create: async (name: string, password?: string): Promise<RoomResponse> => {
    const { data } = await api.post('/api/rooms', { name, password: password || null });
    return data;
  },
  join: async (inviteCode: string, password?: string): Promise<RoomResponse> => {
    const { data } = await api.post('/api/rooms/join', { inviteCode, password: password || null });
    return data;
  },
  listMyRooms: async (): Promise<RoomResponse[]> => {
    const { data } = await api.get('/api/rooms');
    return data;
  },
  getDetail: async (id: string): Promise<RoomDetail> => {
    const { data } = await api.get(`/api/rooms/${id}`);
    return data;
  },
  updateName: async (id: string, name: string): Promise<RoomResponse> => {
    const { data } = await api.put(`/api/rooms/${id}`, { name });
    return data;
  },
  getAvailableDates: async (id: string, startDate: string, endDate: string): Promise<DateAvailability[]> => {
    const { data } = await api.get(`/api/rooms/${id}/available-dates`, {
      params: { startDate, endDate },
    });
    return data;
  },
};

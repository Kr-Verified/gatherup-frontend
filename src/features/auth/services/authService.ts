import api from '@/lib/api';

export interface UserResponse {
  id: string;
  nickname: string;
  age: number | null;
  gender: string | null;
  profileImageUrl?: string | null;
  theme?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export const authService = {
  googleLogin: async (accessToken: string): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/google', { accessToken });
    return data;
  },
  deleteAccount: async (): Promise<void> => {
    await api.delete('/api/user/delete');
  },
  getMe: async (): Promise<UserResponse> => {
    const { data } = await api.get('/api/user/me');
    return data;
  },
  updateProfile: async (payload: Partial<{ nickname: string; profileImageUrl: string | null; theme: string }>): Promise<UserResponse> => {
    const { data } = await api.put('/api/user/me', payload);
    return data;
  },
};

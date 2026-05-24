import api from '@/lib/api';

export interface UserResponse {
  id: string;
  nickname: string;
  age: number | null;
  gender: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export const authService = {
  checkId: async (loginId: string): Promise<boolean> => {
    const { data } = await api.get('/api/auth/check-id', { params: { loginId } });
    return data.isDuplicate;
  },
  register: async (nickname: string, loginId?: string, password?: string, age?: number, gender?: string): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/register', { nickname, loginId, password, age, gender });
    return data;
  },
  login: async (loginId: string, password?: string): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/login', { loginId, password });
    return data;
  },
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
};

'use client';

import { create } from 'zustand';

interface UserState {
  id: string;
  nickname: string;
  token: string;
  isLoggedIn: boolean;
  setUser: (id: string, nickname: string, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

const useUserStore = create<UserState>((set) => ({
  id: '',
  nickname: '',
  token: '',
  isLoggedIn: false,
  setUser: (id: string, nickname: string, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gatherup_user_id', id);
      localStorage.setItem('gatherup_nickname', nickname);
      localStorage.setItem('gatherup_auth_token', token);
    }
    set({ id, nickname, token, isLoggedIn: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gatherup_user_id');
      localStorage.removeItem('gatherup_nickname');
      localStorage.removeItem('gatherup_auth_token');
    }
    set({ id: '', nickname: '', token: '', isLoggedIn: false });
  },
  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('gatherup_user_id') || '';
      const nickname = localStorage.getItem('gatherup_nickname') || '';
      const token = localStorage.getItem('gatherup_auth_token') || '';
      if (id && nickname && token) {
        set({ id, nickname, token, isLoggedIn: true });
      }
    }
  },
}));

export default useUserStore;

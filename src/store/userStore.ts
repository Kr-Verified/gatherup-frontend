'use client';

import { create } from 'zustand';

interface UserState {
  id: string;
  nickname: string;
  token: string;
  profileImageUrl: string;
  theme: string;
  isLoggedIn: boolean;
  setUser: (id: string, nickname: string, token: string, profileImageUrl?: string | null, theme?: string) => void;
  updateUserProfile: (nickname: string, profileImageUrl?: string | null, theme?: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

const useUserStore = create<UserState>((set) => ({
  id: '',
  nickname: '',
  token: '',
  profileImageUrl: '',
  theme: 'midnight',
  isLoggedIn: false,
  setUser: (id: string, nickname: string, token: string, profileImageUrl?: string | null, theme = 'midnight') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gatherup_user_id', id);
      localStorage.setItem('gatherup_nickname', nickname);
      localStorage.setItem('gatherup_auth_token', token);
      localStorage.setItem('gatherup_profile_image_url', profileImageUrl || '');
      localStorage.setItem('gatherup_theme', theme);
    }
    set({ id, nickname, token, profileImageUrl: profileImageUrl || '', theme, isLoggedIn: true });
  },
  updateUserProfile: (nickname: string, profileImageUrl?: string | null, theme = 'midnight') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gatherup_nickname', nickname);
      localStorage.setItem('gatherup_profile_image_url', profileImageUrl || '');
      localStorage.setItem('gatherup_theme', theme);
    }
    set({ nickname, profileImageUrl: profileImageUrl || '', theme });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gatherup_user_id');
      localStorage.removeItem('gatherup_nickname');
      localStorage.removeItem('gatherup_auth_token');
      localStorage.removeItem('gatherup_profile_image_url');
      localStorage.removeItem('gatherup_theme');
    }
    set({ id: '', nickname: '', token: '', profileImageUrl: '', theme: 'midnight', isLoggedIn: false });
  },
  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('gatherup_user_id') || '';
      const nickname = localStorage.getItem('gatherup_nickname') || '';
      const token = localStorage.getItem('gatherup_auth_token') || '';
      const profileImageUrl = localStorage.getItem('gatherup_profile_image_url') || '';
      const theme = localStorage.getItem('gatherup_theme') || 'midnight';
      if (id && nickname && token) {
        set({ id, nickname, token, profileImageUrl, theme, isLoggedIn: true });
      }
    }
  },
}));

export default useUserStore;

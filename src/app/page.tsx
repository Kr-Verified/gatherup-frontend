'use client';

import React, { useEffect, useState } from 'react';
import useUserStore from '@/store/userStore';
import LoginForm from '@/features/auth/components/LoginForm';
import Dashboard from '@/features/room/components/Dashboard';

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function HomePage() {
  const { isLoggedIn, loadFromStorage } = useUserStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadFromStorage();
    setLoaded(true);
  }, [loadFromStorage]);

  if (!loaded) return null;

  if (!isLoggedIn) {
    return (
      <div className="app-container">
        <div className="hero fade-in">
          <div className="hero-logo"></div>
          <h1 className="hero-title">모여라</h1>
          <p className="hero-desc">
            동창 모임 일정 조율이 어려우셨나요?<br />
            각자 일정을 입력하면 모두가 가능한 날을 자동으로 찾아드려요.
          </p>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
            <LoginForm onSuccess={() => { }} />
          </GoogleOAuthProvider>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

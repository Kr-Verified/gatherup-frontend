'use client';

import React, { useState } from 'react';
import { authService } from '@/features/auth/services/authService';
import useUserStore from '@/store/userStore';
import { useGoogleLogin } from '@react-oauth/google';

interface LoginFormProps {
  onSuccess: () => void;
}

type Mode = 'login' | 'register';

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [idChecked, setIdChecked] = useState(false);
  const [checkingId, setCheckingId] = useState(false);
  const [idMessage, setIdMessage] = useState('');

  const setUser = useUserStore((s) => s.setUser);

  const handleCheckId = async () => {
    if (!loginId.trim()) return;
    setCheckingId(true);
    setIdMessage('');
    try {
      const isDuplicate = await authService.checkId(loginId.trim());
      if (isDuplicate) {
        setIdMessage('이미 사용 중인 아이디입니다.');
        setIdChecked(false);
      } else {
        setIdMessage('사용 가능한 아이디입니다.');
        setIdChecked(true);
      }
    } catch (err: any) {
      setIdMessage('중복 확인 실패');
    } finally {
      setCheckingId(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { user, token } = await authService.login(loginId, password);
      setUser(user.id, user.nickname, token);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idChecked) {
      setError('아이디 중복 확인을 해주세요.');
      return;
    }
    if (!loginId || !password || !nickname.trim()) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { user, token } = await authService.register(
        nickname.trim(),
        loginId.trim(),
        password,
        age ? parseInt(age) : undefined,
        gender || undefined
      );
      setUser(user.id, user.nickname, token);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const { user, token } = await authService.googleLogin(tokenResponse.access_token);
        setUser(user.id, user.nickname, token);
        onSuccess();
      } catch (err: any) {
        setError('구글 로그인에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('구글 로그인에 실패했습니다.'),
  });

  return (
    <div className="hero-form slide-up">
      <div className="flex-gap" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
        <button 
          className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ flex: 1, borderRadius: '8px 8px 0 0', borderBottom: mode === 'login' ? 'none' : '1px solid var(--border-glass)' }}
          onClick={() => { setMode('login'); setError(''); }}
        >
          로그인
        </button>
        <button 
          className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ flex: 1, borderRadius: '8px 8px 0 0', borderBottom: mode === 'register' ? 'none' : '1px solid var(--border-glass)' }}
          onClick={() => { setMode('register'); setError(''); }}
        >
          회원가입
        </button>
      </div>

      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="flex-col-gap">
        {mode === 'register' ? (
          <>
            <div className="input-group">
              <label>아이디 *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input"
                  type="text"
                  placeholder="아이디"
                  value={loginId}
                  onChange={(e) => { setLoginId(e.target.value); setIdChecked(false); setIdMessage(''); }}
                  required
                />
                <button type="button" className="btn btn-secondary" onClick={handleCheckId} disabled={checkingId || !loginId}>
                  중복확인
                </button>
              </div>
              {idMessage && <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: idChecked ? 'var(--success)' : 'var(--danger)' }}>{idMessage}</p>}
            </div>
            <div className="input-group">
              <label>비밀번호 *</label>
              <input
                className="input"
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>닉네임 *</label>
              <input
                className="input"
                type="text"
                placeholder="별명을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>
            <div className="optional-fields">
              <div className="input-group">
                <label>나이 (선택)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="나이"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>성별 (선택)</label>
                <select
                  className="input"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">선택 안 함</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="input-group">
              <label>아이디</label>
              <input
                className="input"
                type="text"
                placeholder="아이디"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>비밀번호</label>
              <input
                className="input"
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}
        
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
        
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? '처리 중...' : (mode === 'login' ? '로그인' : '회원가입')}
        </button>

        <div style={{ position: 'relative', textAlign: 'center', margin: '1rem 0' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-card)', padding: '0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            또는
          </span>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary btn-full" 
          onClick={() => googleLogin()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Google 로그인
        </button>
      </form>
    </div>
  );
}

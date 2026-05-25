'use client';

import React, { useState } from 'react';
import { authService } from '@/features/auth/services/authService';
import useUserStore from '@/store/userStore';

interface Props {
  onClose: () => void;
}

const THEMES = [
  { value: 'midnight', label: '미드나잇' },
  { value: 'forest', label: '포레스트' },
  { value: 'rose', label: '로즈' },
  { value: 'daylight', label: '데이라이트' },
];

export default function ProfileSettingsModal({ onClose }: Props) {
  const { nickname, profileImageUrl, theme, updateUserProfile } = useUserStore();
  const [nextNickname, setNextNickname] = useState(nickname);
  const [nextProfileImageUrl, setNextProfileImageUrl] = useState(profileImageUrl);
  const [nextTheme, setNextTheme] = useState(theme);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > 700 * 1024) {
      setError('프로필 사진은 700KB 이하로 업로드해주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNextProfileImageUrl(String(reader.result));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nextNickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const user = await authService.updateProfile({
        nickname: nextNickname.trim(),
        profileImageUrl: nextProfileImageUrl || null,
        theme: nextTheme,
      });
      updateUserProfile(user.nickname, user.profileImageUrl, user.theme || 'midnight');
      document.documentElement.dataset.theme = user.theme || 'midnight';
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || '프로필 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">프로필 수정</h2>
        <form onSubmit={handleSave} className="flex-col-gap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="nav-avatar profile-preview">
              {nextProfileImageUrl ? <img src={nextProfileImageUrl} alt="" /> : nextNickname.charAt(0).toUpperCase()}
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label htmlFor="profile-image">프로필 사진</label>
              <input id="profile-image" className="input" type="file" accept="image/*" onChange={handleImageChange} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="profile-nickname">닉네임</label>
            <input
              id="profile-nickname"
              className="input"
              value={nextNickname}
              onChange={(e) => setNextNickname(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="profile-theme">전체 테마</label>
            <select id="profile-theme" className="input" value={nextTheme} onChange={(e) => setNextTheme(e.target.value)}>
              {THEMES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '저장 중...' : '저장'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

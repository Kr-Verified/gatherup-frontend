'use client';

import React, { useState } from 'react';
import { roomService } from '@/features/room/services/roomService';

interface Props {
  onClose: () => void;
  onJoined: () => void;
}

export default function JoinRoomModal({ onClose, onJoined }: Props) {
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('초대코드를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await roomService.join(inviteCode.trim(), password || undefined);
      onJoined();
    } catch (err: any) {
      setError(err.response?.data?.error || '입장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">초대코드로 입장</h2>
        <form onSubmit={handleJoin} className="flex-col-gap">
          <div className="input-group">
            <label htmlFor="invite-code">초대코드 *</label>
            <input
              id="invite-code"
              className="input"
              type="text"
              placeholder="6자리 초대코드 입력"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
              style={{ letterSpacing: '0.15em', fontWeight: 600 }}
            />
          </div>
          <div className="input-group">
            <label htmlFor="join-password">비밀번호 (설정된 경우)</label>
            <input
              id="join-password"
              className="input"
              type="password"
              placeholder="방 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '입장 중...' : '입장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

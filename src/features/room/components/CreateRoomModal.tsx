'use client';

import React, { useState } from 'react';
import { roomService } from '@/features/room/services/roomService';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateRoomModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('방 이름을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const room = await roomService.create(name.trim(), password || undefined);
      setInviteCode(room.inviteCode);
    } catch (err: any) {
      setError(err.response?.data?.error || '방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
  };

  if (inviteCode) {
    return (
      <div className="modal-overlay" onClick={onCreated}>
        <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">방이 생성되었습니다!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
            아래 초대코드를 공유하여 친구들을 초대하세요.
          </p>
          <div className="invite-code-display">
            <code>{inviteCode}</code>
            <button className="btn btn-secondary btn-sm copy-btn" onClick={copyCode}>
              복사
            </button>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={onCreated}>확인</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">새 방 만들기</h2>
        <form onSubmit={handleCreate} className="flex-col-gap">
          <div className="input-group">
            <label htmlFor="room-name">방 이름 *</label>
            <input
              id="room-name"
              className="input"
              type="text"
              placeholder="예: 고등학교 동창 모임"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="input-group">
            <label htmlFor="room-password">비밀번호 (선택)</label>
            <input
              id="room-password"
              className="input"
              type="password"
              placeholder="비밀번호를 설정하면 입장 시 필요합니다"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '생성 중...' : '방 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

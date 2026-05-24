'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useUserStore from '@/store/userStore';
import { roomService, RoomResponse } from '@/features/room/services/roomService';
import CreateRoomModal from './CreateRoomModal';
import JoinRoomModal from './JoinRoomModal';
import RoomView from './RoomView';
import SchedulePanel from '@/features/schedule/components/SchedulePanel';

type View = 'dashboard' | 'room' | 'schedule';

export default function Dashboard() {
  const { nickname, logout } = useUserStore();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await roomService.listMyRooms();
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const openRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setView('room');
  };

  const handleDeleteAccount = async () => {
    try {
      const { authService } = await import('@/features/auth/services/authService');
      await authService.deleteAccount();
      logout();
    } catch (err: any) {
      alert(err.response?.data?.error || '회원탈퇴에 실패했습니다.');
    }
  };

  return (
    <div className="app-container fade-in">
      {/* Navigation */}
      <nav className="nav">
        <a className="nav-brand" href="#" onClick={() => setView('dashboard')}>
          <span>모여라</span>
        </a>
        <div className="nav-links">
          <a
            className={`nav-link ${view === 'dashboard' ? 'active' : ''}`}
            href="#"
            onClick={() => setView('dashboard')}
          >
            대시보드
          </a>
          <a
            className={`nav-link ${view === 'schedule' ? 'active' : ''}`}
            href="#"
            onClick={() => setView('schedule')}
          >
            내 일정
          </a>
        </div>
        <div className="nav-user" style={{ position: 'relative' }}>
          <div className="nav-avatar">{nickname.charAt(0).toUpperCase()}</div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{nickname}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(!showSettings)}>수정 ▼</button>
          
          {showSettings && (
            <div className="glass-card slide-up" style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
              padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
              minWidth: '120px', zIndex: 50, backgroundColor: 'rgba(30, 41, 59, 0.95)'
            }}>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setShowSettings(false); logout(); }}>로그아웃</button>
              <button className="btn btn-danger btn-sm" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setShowSettings(false); setShowDeleteConfirm(true); }}>회원탈퇴</button>
            </div>
          )}
        </div>
      </nav>

      {/* Dashboard View */}
      {view === 'dashboard' && (
        <div className="slide-up">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h1 className="page-title">안녕하세요, {nickname}님!</h1>
              <p className="page-subtitle">참여 중인 방을 선택하거나 새로운 방을 만들어보세요.</p>
            </div>
            <div className="flex-gap">
              <button className="btn btn-secondary" onClick={() => setShowJoinModal(true)}>초대코드 입력</button>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>방 만들기</button>
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="glass-card empty-state">
              <p className="empty-state-text">아직 참여한 방이 없습니다.<br />방을 만들거나 초대코드로 입장하세요!</p>
              <div className="flex-gap" style={{ justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setShowJoinModal(true)}>초대코드 입력</button>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>방 만들기</button>
              </div>
            </div>
          ) : (
            <div className="grid-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="glass-card room-card"
                  onClick={() => openRoom(room.id)}
                >
                  <div className="room-card-header">
                    <span className="room-card-name">{room.name}</span>
                    <span className="room-card-code">{room.inviteCode}</span>
                  </div>
                  <div className="room-card-meta">
                    {new Date(room.createdAt).toLocaleDateString('ko-KR')} 생성
                    {room.hasPassword ? ' · 비밀번호 있음' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Room View */}
      {view === 'room' && (
        <RoomView roomId={selectedRoomId} onBack={() => setView('dashboard')} />
      )}

      {/* Schedule View */}
      {view === 'schedule' && (
        <SchedulePanel />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchRooms(); }}
        />
      )}
      {showJoinModal && (
        <JoinRoomModal
          onClose={() => setShowJoinModal(false)}
          onJoined={() => { setShowJoinModal(false); fetchRooms(); }}
        />
      )}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">회원탈퇴</h2>
            <p style={{ color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
              정말 탈퇴하시겠습니까? 등록된 일정과 가입된 방 정보가 모두 삭제되며 복구할 수 없습니다.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>취소</button>
              <button className="btn btn-danger" onClick={handleDeleteAccount}>탈퇴하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { roomService, RoomDetail, DateAvailability } from '@/features/room/services/roomService';
import AvailabilityCalendar from './AvailabilityCalendar';
import dayjs from 'dayjs';
import useUserStore from '@/store/userStore';

interface Props {
  roomId: string;
  onBack: () => void;
}

export default function RoomView({ roomId, onBack }: Props) {
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [availability, setAvailability] = useState<DateAvailability[]>([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [copied, setCopied] = useState(false);

  const { id: currentUserId } = useUserStore();

  const [checkStartDate, setCheckStartDate] = useState('');
  const [checkEndDate, setCheckEndDate] = useState('');
  const [checkResult, setCheckResult] = useState<DateAvailability[] | null>(null);
  const [checking, setChecking] = useState(false);

  const [showMembers, setShowMembers] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [excludedMembers, setExcludedMembers] = useState<string[]>([]);

  const fetchDetail = useCallback(async () => {
    try {
      const data = await roomService.getDetail(roomId);
      setDetail(data);
    } catch (err) {
      console.error(err);
    }
  }, [roomId]);

  const fetchAvailability = useCallback(async (month: dayjs.Dayjs) => {
    try {
      const start = month.startOf('month').format('YYYY-MM-DD');
      const end = month.endOf('month').format('YYYY-MM-DD');
      const data = await roomService.getAvailableDates(roomId, start, end);
      setAvailability(data);
    } catch (err) {
      console.error(err);
    }
  }, [roomId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    fetchAvailability(currentMonth);
  }, [currentMonth, fetchAvailability]);

  const copyCode = () => {
    if (detail) {
      navigator.clipboard.writeText(detail.room.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateName = async () => {
    if (!editingName.trim()) return;
    try {
      await roomService.updateName(roomId, editingName.trim());
      setDetail(prev => prev ? { ...prev, room: { ...prev.room, name: editingName.trim() } } : null);
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
      alert('방 이름 수정에 실패했습니다.');
    }
  };

  const handleCheckSpecificDates = async (start: string, end: string) => {
    setCheckStartDate(start);
    setCheckEndDate(end);
    setChecking(true);
    try {
      const data = await roomService.getAvailableDates(roomId, start, end);
      setCheckResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const applyFilter = (data: DateAvailability[]) => {
    if (!detail) return data;
    const activeMembersCount = detail.members.length - excludedMembers.length;
    if (activeMembersCount <= 0) return data; // Prevent division by zero logic

    return data.map(a => {
      const filteredBusy = a.busyMembers.filter(id => !excludedMembers.includes(id));
      let status: 'all-free' | 'some-busy' | 'all-busy' = 'some-busy';
      if (filteredBusy.length === 0) status = 'all-free';
      else if (filteredBusy.length === activeMembersCount) status = 'all-busy';

      return {
        ...a,
        status,
        busyMembers: filteredBusy,
        availableCount: activeMembersCount - filteredBusy.length,
        totalCount: activeMembersCount
      };
    });
  };

  const filteredAvailability = applyFilter(availability);
  const filteredCheckResult = checkResult ? applyFilter(checkResult) : null;

  const getNearestAvailableDate = () => {
    // Search availability state for nearest available date from today
    const today = dayjs().startOf('day');
    let nearest: DateAvailability | null = null;
    let minDiff = Infinity;

    filteredAvailability.forEach(a => {
      if (a.status === 'all-free') {
        const date = dayjs(a.date);
        const diff = Math.abs(date.diff(today, 'day'));
        if (diff < minDiff) {
          minDiff = diff;
          nearest = a;
        }
      }
    });
    return nearest as DateAvailability | null;
  };

  const displayResults = [...(filteredCheckResult && filteredCheckResult.length > 0 ? filteredCheckResult : filteredAvailability)]
    .filter(a => a.status === 'some-busy')
    .sort((a, b) => {
      return dayjs(a.date).diff(dayjs(b.date));
    });

  if (!detail) {
    return (
      <div className="empty-state">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div className="flex-between" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={onBack}>뒤로</button>
            {isEditingName ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  className="input"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleUpdateName}>저장</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingName(false)}>취소</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>{detail.room.name}</h1>
                {detail.room.creatorId === currentUserId && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setIsEditingName(true); setEditingName(detail.room.name); }}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    수정
                  </button>
                )}
              </div>
            )}
          </div>
          <div style={{ paddingLeft: '4rem' }}>
            <p
              className="page-subtitle"
              onClick={() => setShowMembers(!showMembers)}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              멤버 {detail.members.length}명 {showMembers ? '▲' : '▼'}
            </p>
            {showMembers && (
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  클릭하여 가용성 확인에서 제외할 수 있습니다.
                </p>
                <div className="member-list">
                  {detail.members.map((m) => {
                    const isExcluded = excludedMembers.includes(m.userId);
                    return (
                      <div
                        key={m.id}
                        className="member-chip"
                        onClick={() => setExcludedMembers(prev => isExcluded ? prev.filter(id => id !== m.userId) : [...prev, m.userId])}
                        style={{ cursor: 'pointer', opacity: isExcluded ? 0.4 : 1, transition: 'opacity 0.2s' }}
                      >
                        <div className="member-chip-dot" style={{ background: isExcluded ? 'var(--text-muted)' : 'var(--primary)' }}></div>
                        <span style={{ textDecoration: isExcluded ? 'line-through' : 'none' }}>{m.user.nickname}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="invite-code-display" style={{ padding: '0.625rem 1rem' }}>
          <code style={{ fontSize: '1rem' }}>{detail.room.inviteCode}</code>
          <button className="btn btn-secondary btn-sm" onClick={copyCode}>
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>

      <div className="room-layout" style={{ alignItems: 'start' }}>
        {/* Calendar */}
        <div className="glass-card">
          <h3 className="section-title">일정 가용성</h3>
          <AvailabilityCalendar
            currentMonth={currentMonth}
            availability={filteredAvailability}
            members={detail.members.filter(m => !excludedMembers.includes(m.userId))}
            onPrevMonth={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
            onNextMonth={() => setCurrentMonth(currentMonth.add(1, 'month'))}
            onMonthChange={setCurrentMonth}
            onSelectRange={handleCheckSpecificDates}
          />
          <div className="legend" style={{ marginTop: '1rem' }}>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: 'var(--success)' }}></div>
              모두 가능
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: 'var(--warning)' }}></div>
              일부 불가
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: 'var(--danger)' }}></div>
              모두 불가
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}></div>
              데이터 없음
            </div>
          </div>
        </div>

        {/* Specific Date Check */}
        <div className="glass-card slide-up">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              {checkStartDate && checkEndDate
                ? `일부 불가 확인 (${dayjs(checkStartDate).format('M/D')} ~ ${dayjs(checkEndDate).format('M/D')})`
                : `${currentMonth.format('M월')} 일부 불가 (전체)`}
            </h3>
            {checking && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>조회 중...</span>}
          </div>

          <div className="flex-col-gap">
            {displayResults.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>데이터가 없습니다.</p>
            ) : (
              displayResults.map(r => {
                const isAllFree = r.status === 'all-free';
                const isAllBusy = r.status === 'all-busy';
                let bgStyle = 'var(--bg-glass)';
                let message = '';

                if (isAllFree) {
                  bgStyle = 'var(--success-bg)';
                } else if (isAllBusy) {
                  bgStyle = 'var(--danger-bg)';
                } else if (r.status === 'some-busy') {
                  const busyNames = r.busyMembers.map(id => detail.members.find(m => m.userId === id)?.user.nickname || '알 수 없음').join(', ');
                  message = `${busyNames}`;
                }

                return (
                  <div key={r.date} style={{ padding: '1rem', borderRadius: '8px', background: bgStyle, border: '1px solid var(--border-glass)' }}>
                    <h4 style={{ marginBottom: message || isAllBusy ? '0.5rem' : 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {dayjs(r.date).format('YYYY년 M월 D일')}
                      {isAllFree && <span className="badge badge-success">가능</span>}
                      {isAllBusy && <span className="badge badge-danger">불가</span>}
                    </h4>
                    {message && <p style={{ fontSize: '0.9375rem' }}>{message}</p>}

                    {isAllBusy && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        추천 대안: {getNearestAvailableDate() ? dayjs(getNearestAvailableDate()!.date).format('M월 D일') + '이 가장 가까운 가능한 날입니다.' : '현재 모두 가능한 날이 없습니다.'}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

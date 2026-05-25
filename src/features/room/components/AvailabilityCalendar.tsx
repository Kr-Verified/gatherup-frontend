'use client';

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DateAvailability } from '@/features/room/services/roomService';

interface Props {
  currentMonth: dayjs.Dayjs;
  availability: DateAvailability[];
  members: { userId: string; user: { nickname: string } }[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthChange?: (date: dayjs.Dayjs) => void;
  onSelectRange?: (start: string, end: string) => void;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function AvailabilityCalendar({ currentMonth, availability, members, onPrevMonth, onNextMonth, onMonthChange, onSelectRange }: Props) {
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingMonth, setIsEditingMonth] = useState(false);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; text: string }>({ visible: false, x: 0, y: 0, text: '' });

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging && dragStart && dragEnd && onSelectRange) {
        const start = dayjs(dragStart).isBefore(dayjs(dragEnd)) ? dragStart : dragEnd;
        const end = dayjs(dragStart).isBefore(dayjs(dragEnd)) ? dragEnd : dragStart;
        onSelectRange(start, end);
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDragging, dragStart, dragEnd, onSelectRange]);

  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const startDay = startOfMonth.day();
  const daysInMonth = endOfMonth.date();
  const today = dayjs().format('YYYY-MM-DD');

  const availabilityMap: Record<string, DateAvailability> = {};
  availability.forEach((a) => {
    availabilityMap[a.date] = a;
  });

  const memberMap: Record<string, string> = {};
  members.forEach((m) => {
    memberMap[m.userId] = m.user.nickname;
  });

  const cells: React.ReactNode[] = [];

  const isDateSelected = (dateStr: string) => {
    if (!dragStart || !dragEnd) return false;
    const d = dayjs(dateStr);
    const start = dayjs(dragStart).isBefore(dayjs(dragEnd)) ? dayjs(dragStart) : dayjs(dragEnd);
    const end = dayjs(dragStart).isBefore(dayjs(dragEnd)) ? dayjs(dragEnd) : dayjs(dragStart);
    return (d.isSame(start, 'day') || d.isSame(end, 'day') || (d.isAfter(start) && d.isBefore(end)));
  };

  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = currentMonth.date(day).format('YYYY-MM-DD');
    const a = availabilityMap[dateStr];
    const isToday = dateStr === today;
    const selected = isDateSelected(dateStr);

    let statusClass = '';
    if (a) {
      statusClass = a.status === 'all-free' ? 'all-free' : a.status === 'some-busy' ? 'some-busy' : 'all-busy';
    }

    let titleText = '';
    if (a) {
      const busyIds = new Set(a.busyMembers || []);
      const busyNames = members.filter(m => busyIds.has(m.userId)).map(m => m.user.nickname);
      const availableNames = members.filter(m => !busyIds.has(m.userId)).map(m => m.user.nickname);

      if (a.status === 'some-busy') {
        titleText = `일부 불가 (${a.availableCount}/${a.totalCount}명)\n가능: ${availableNames.join(', ') || '없음'}\n불가: ${busyNames.join(', ') || '없음'}`;
      }
    }

    let className = `calendar-day interactive ${statusClass}`;
    if (isToday) className += ' today';
    if (selected) className += ' selected';

    cells.push(
      <div
        key={day}
        className={className}
        data-date={dateStr}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          setIsDragging(true);
          setDragStart(dateStr);
          setDragEnd(dateStr);
          setTooltip({ ...tooltip, visible: false });
        }}
        onPointerEnter={(e) => {
          if (isDragging) {
            setDragEnd(dateStr);
            return;
          }
          if (titleText && !isDragging) {
            setTooltip({ visible: true, x: e.clientX, y: e.clientY, text: titleText });
          }
        }}
        onPointerMove={(e) => {
          if (isDragging) {
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const date = target instanceof HTMLElement ? target.closest<HTMLElement>('[data-date]')?.dataset.date : undefined;
            if (date) setDragEnd(date);
            return;
          }
          if (!isDragging && titleText) {
            setTooltip({ visible: true, x: e.clientX, y: e.clientY, text: titleText });
          }
        }}
        onPointerLeave={() => setTooltip({ ...tooltip, visible: false })}
      >
        {day}
      </div>
    );
  }

  return (
    <div style={{ userSelect: 'none' }}>
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={onPrevMonth}>‹</button>
        {isEditingMonth ? (
          <input
            type="month"
            autoFocus
            className="input"
            style={{ width: 'auto', padding: '0.25rem 0.5rem', textAlign: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}
            value={currentMonth.format('YYYY-MM')}
            onChange={(e) => {
              if (e.target.value && onMonthChange) {
                onMonthChange(dayjs(e.target.value + '-01'));
              }
              setIsEditingMonth(false);
            }}
            onBlur={() => setIsEditingMonth(false)}
          />
        ) : (
          <span 
            style={{ fontWeight: 600, fontSize: '1rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '4px' }} 
            onClick={() => setIsEditingMonth(true)}
            title="클릭하여 월/년도 변경"
          >
            {currentMonth.format('YYYY년 M월')} ▾
          </span>
        )}
        <button className="calendar-nav-btn" onClick={onNextMonth}>›</button>
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
        날짜를 드래그하거나 클릭하여 특정 기간의 가용성을 상세히 확인하세요.
      </p>
      <div className="calendar">
        {DAY_LABELS.map((label) => (
          <div key={label} className="calendar-day-label">{label}</div>
        ))}
        {cells}
      </div>

      {tooltip.visible && (
        <div style={{
          position: 'fixed',
          top: tooltip.y + 15,
          left: tooltip.x + 15,
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          whiteSpace: 'pre-line',
          zIndex: 1000,
          pointerEvents: 'none',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

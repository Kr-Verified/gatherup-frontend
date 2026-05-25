'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { scheduleService, ScheduleResponse } from '@/features/schedule/services/scheduleService';
import { parseIcsSchedules } from '@/features/schedule/utils/icsParser';
import dayjs from 'dayjs';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function SchedulePanel() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState('#7c3aed');
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingMonth, setIsEditingMonth] = useState(false);

  const fetchSchedules = useCallback(async () => {
    try {
      const data = await scheduleService.list();
      setSchedules(data);
      setFetchError('');
      if (typeof window !== 'undefined') {
        localStorage.setItem('gatherup_cached_schedules', JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      setFetchError('일정을 불러오지 못했습니다.');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('gatherup_cached_schedules');
      if (cached) {
        try {
          setSchedules(JSON.parse(cached));
          setFetching(false);
        } catch {
          localStorage.removeItem('gatherup_cached_schedules');
        }
      }
    }
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging && dragStart && dragEnd) {
        const start = dayjs(dragStart).isBefore(dayjs(dragEnd)) ? dragStart : dragEnd;
        const end = dayjs(dragStart).isBefore(dayjs(dragEnd)) ? dragEnd : dragStart;
        setStartDate(start);
        setEndDate(end);
        setShowForm(true);
        setEditingId(null);
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
  }, [isDragging, dragStart, dragEnd]);

  const resetForm = () => {
    setTitle('');
    setStartDate('');
    setEndDate('');
    setEditingId(null);
    setShowForm(false);
    setError('');
    setColor('#7c3aed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await scheduleService.update(editingId, { title, startDate, endDate, color });
      } else {
        await scheduleService.create(startDate, endDate, title.trim(), color);
      }
      resetForm();
      setFetching(true);
      fetchSchedules();
    } catch (err: any) {
      setError(err.response?.data?.error || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s: ScheduleResponse) => {
    setEditingId(s.id);
    setTitle(s.title);
    setStartDate(dayjs(s.startDate).format('YYYY-MM-DD'));
    setEndDate(dayjs(s.endDate).format('YYYY-MM-DD'));
    setColor(s.color || '#7c3aed');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await scheduleService.delete(deletingId);
      setDeletingId(null);
      setFetching(true);
      fetchSchedules();
    } catch (err: any) {
      alert(err.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  const handleImportIcs = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.ics') && file.type && !file.type.includes('calendar')) {
      setImportMessage('ICS 파일만 가져올 수 있습니다.');
      return;
    }
    if (file.size > 1_000_000) {
      setImportMessage('ICS 파일은 1MB 이하만 가져올 수 있습니다.');
      return;
    }

    setImporting(true);
    setImportMessage('');
    try {
      const text = await file.text();
      const parsed = parseIcsSchedules(text);
      if (parsed.length === 0) {
        setImportMessage('가져올 수 있는 일정이 없습니다.');
        return;
      }
      const result = await scheduleService.importMany(parsed);
      setImportMessage(`${result.importedCount}개 일정을 가져왔습니다.`);
      setFetching(true);
      fetchSchedules();
    } catch (err: any) {
      setImportMessage(err.response?.data?.error || err.message || '일정 가져오기에 실패했습니다.');
    } finally {
      setImporting(false);
    }
  };

  // Calendar rendering logic
  const renderCalendar = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();
    const today = dayjs().format('YYYY-MM-DD');

    const cells = [];
    
    // Check if a date is within an existing schedule
    const getSchedulesForDate = (dateStr: string) => {
      const d = dayjs(dateStr);
      return schedules.filter(s => {
        const start = dayjs(s.startDate).startOf('day');
        const end = dayjs(s.endDate).endOf('day');
        return d.isSame(start, 'day') || d.isSame(end, 'day') || (d.isAfter(start) && d.isBefore(end));
      });
    };

    // Check if a date is selected by drag
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
      const isToday = dateStr === today;
      const daySchedules = getSchedulesForDate(dateStr);
      const selected = isDateSelected(dateStr);

      let className = 'calendar-day interactive';
      if (isToday) className += ' today';
      if (selected) className += ' selected';

      cells.push(
        <div
          key={day}
          className={className}
          data-date={dateStr}
          style={{ display: 'flex', flexDirection: 'column', padding: '4px', alignItems: 'stretch' }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            setIsDragging(true);
            setDragStart(dateStr);
            setDragEnd(dateStr);
          }}
          onPointerEnter={() => {
            if (isDragging) {
              setDragEnd(dateStr);
            }
          }}
          onPointerMove={(e) => {
            if (!isDragging) return;
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const date = target instanceof HTMLElement ? target.closest<HTMLElement>('[data-date]')?.dataset.date : undefined;
            if (date) setDragEnd(date);
          }}
        >
          <span style={{ alignSelf: 'center', marginBottom: '2px', zIndex: 2 }}>{day}</span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {daySchedules.map(s => {
              const start = dayjs(s.startDate).startOf('day');
              const end = dayjs(s.endDate).startOf('day');
              const d = dayjs(dateStr).startOf('day');
              
              const isStart = d.isSame(start, 'day');
              const isEnd = d.isSame(end, 'day');
              const isStartOfWeek = d.day() === 0;

              // To make bars continuous, we remove horizontal gap manually
              const marginLeft = isStart ? '0' : '-6px';
              const marginRight = isEnd ? '0' : '-6px';
              const borderRadius = `${isStart ? '4px' : '0'} ${isEnd ? '4px' : '0'} ${isEnd ? '4px' : '0'} ${isStart ? '4px' : '0'}`;

              return (
                <div 
                  key={s.id} 
                  className="schedule-bar"
                  style={{ 
                    marginLeft, 
                    marginRight, 
                    borderRadius, 
                    background: s.color || 'var(--primary)',
                    zIndex: 1,
                    position: 'relative'
                  }}
                >
                  {(isStart || isStartOfWeek) ? s.title : '\u00A0'}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card" style={{ marginBottom: '1.5rem', userSelect: 'none' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>내 캘린더</h3>
          <div className="calendar-header" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
            <button className="calendar-nav-btn" onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}>‹</button>
            {isEditingMonth ? (
              <input
                type="month"
                autoFocus
                className="input"
                style={{ width: 'auto', padding: '0.25rem 0.5rem', textAlign: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', margin: '0 0.5rem' }}
                value={currentMonth.format('YYYY-MM')}
                onChange={(e) => {
                  if (e.target.value) {
                    setCurrentMonth(dayjs(e.target.value + '-01'));
                  }
                  setIsEditingMonth(false);
                }}
                onBlur={() => setIsEditingMonth(false)}
              />
            ) : (
              <span 
                style={{ fontWeight: 600, fontSize: '1rem', width: '110px', textAlign: 'center', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                onClick={() => setIsEditingMonth(true)}
                title="클릭하여 월/년도 변경"
              >
                {currentMonth.format('YYYY년 M월')} ▾
              </span>
            )}
            <button className="calendar-nav-btn" onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}>›</button>
          </div>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          날짜를 클릭하거나 드래그하여 새 일정을 추가하세요.
        </p>
        <div className="calendar">
          {DAY_LABELS.map((label) => (
            <div key={label} className="calendar-day-label">{label}</div>
          ))}
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div className="slide-up">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">내 일정</h1>
          <p className="page-subtitle">개인 일정을 관리하세요. 등록한 일정은 참여한 모든 방에 반영됩니다.</p>
        </div>
        <label className={`btn btn-secondary ${importing ? 'disabled' : ''}`} style={{ cursor: importing ? 'not-allowed' : 'pointer' }}>
          {importing ? '가져오는 중...' : 'ICS 가져오기'}
          <input type="file" accept=".ics,text/calendar" onChange={handleImportIcs} disabled={importing} style={{ display: 'none' }} />
        </label>
      </div>

      {renderCalendar()}
      {importMessage && <p style={{ color: importMessage.includes('실패') || importMessage.includes('없습니다') || importMessage.includes('이하') || importMessage.includes('ICS') ? 'var(--danger)' : 'var(--success)', fontSize: '0.875rem', marginBottom: '1rem' }}>{importMessage}</p>}
      {fetchError && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{fetchError}</p>}

      {/* Schedule Form */}
      {showForm && (
        <div className="glass-card slide-up" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary)' }}>
          <h3 className="section-title">{editingId ? '일정 수정' : '새 일정'}</h3>
          <form onSubmit={handleSubmit} className="flex-col-gap">
            <div className="input-group">
              <label htmlFor="schedule-title">일정 제목</label>
              <input
                id="schedule-title"
                className="input"
                type="text"
                placeholder="예: 가족 여행, 출장"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label htmlFor="start-date">시작일</label>
                <input
                  id="start-date"
                  className="input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="end-date">종료일</label>
                <input
                  id="end-date"
                  className="input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="color">색상</label>
                <input
                  id="color"
                  className="input"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ padding: '0.25rem', height: '100%' }}
                />
              </div>
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
            <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>취소</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '저장 중...' : editingId ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule List */}
      <h3 className="section-title">등록된 일정 목록</h3>
      {fetching ? (
        <div className="glass-card empty-state">
          <p className="empty-state-text">일정을 불러오는 중입니다.</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="glass-card empty-state">
          <p className="empty-state-text">등록된 일정이 없습니다.</p>
        </div>
      ) : (
        <div className="flex-col-gap">
          {schedules.map((s) => (
            <div key={s.id} className="schedule-item" style={{ borderLeft: `4px solid ${s.color || 'var(--primary)'}` }}>
              <div className="schedule-item-info">
                <h4>{s.title}</h4>
                <p>
                  {dayjs(s.startDate).format('YYYY.MM.DD')} ~ {dayjs(s.endDate).format('YYYY.MM.DD')}
                </p>
              </div>
              <div className="schedule-item-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(s)}>수정</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeletingId(s.id)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">일정 삭제</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>이 일정을 정말 삭제하시겠습니까?</p>
            <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingId(null)}>취소</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { schedulesAPI, Schedule } from '@/services/api';
import { EVENT_TYPE_CONFIG, getEventTypeKey, parseScheduleDate, getDaysInMonth, getFirstDayOfMonth, MONTHS, NewEventForm, EventType } from '@/components/schedule/ScheduleConstants';
import { CalendarGrid } from '@/components/schedule/CalendarGrid';
import { EventDetailModal } from '@/components/schedule/EventDetailModal';
import { ScheduleFormModal } from '@/components/schedule/ScheduleFormModal';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, User, List, Grid3X3, MoreVertical, RefreshCw } from 'lucide-react';

export default function SchedulePage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEventForm>({
    title: '',
    schedule_type: 'shooting',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    memo: '',
  });

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch current month range
      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${lastDay}`;
      const result = await schedulesAPI.list({ start_date: startDate, end_date: endDate });
      setSchedules(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('일정 로드 실패:', err);
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const goToPrevMonth = () => currentMonth === 0 ? (setCurrentMonth(11), setCurrentYear(y => y - 1)) : setCurrentMonth(m => m - 1);
  const goToNextMonth = () => currentMonth === 11 ? (setCurrentMonth(0), setCurrentYear(y => y + 1)) : setCurrentMonth(m => m + 1);
  const goToToday = () => { setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); };

  // Calendar date computation
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    setIsSaving(true);
    try {
      await schedulesAPI.create({
        title: newEvent.title, schedule_type: newEvent.schedule_type,
        start_datetime: newEvent.start_time ? `${newEvent.date}T${newEvent.start_time}:00` : `${newEvent.date}T00:00:00`,
        end_datetime: newEvent.end_time ? `${newEvent.date}T${newEvent.end_time}:00` : undefined,
        location: newEvent.location || undefined, memo: newEvent.memo || undefined, status: 'confirmed',
      });
      setShowNewModal(false);
      setNewEvent({ title: '', schedule_type: 'shooting', date: '', start_time: '', end_time: '', location: '', memo: '' });
      fetchSchedules();
    } catch (err) { console.error('일정 등록 실패:', err); } finally { setIsSaving(false); }
  };

  const filteredEvents = schedules.filter(s => typeFilter === 'all' || s.schedule_type === typeFilter)
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
  const thisMonthEvents = schedules.filter(s => {
    const d = new Date(parseScheduleDate(s.start_datetime).date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  return (
    <div className="space-y-6">
      {/* Top header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={goToPrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold min-w-[140px] text-center">{currentYear}년 {MONTHS[currentMonth]}</h2>
              <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">오늘</button>
          </div>

          <div className="flex items-center gap-3">
            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EventType | 'all')}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">모든 일정</option>
              {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* View mode toggle */}
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 ${viewMode === 'calendar' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* New event button */}
            <button
              onClick={() => setShowNewModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              일정 추가
            </button>
          </div>
        </div>

        {/* This month statistics */}
        <div className="mt-4 flex items-center gap-6 text-sm flex-wrap">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
            {isLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
            이번 달 일정: <span className="font-semibold text-gray-800 dark:text-gray-100">{thisMonthEvents.length}건</span>
          </span>
          {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => {
            const count = thisMonthEvents.filter(s => s.schedule_type === key).length;
            if (count === 0) return null;
            return (
              <span key={key} className={`${config.color}`}>
                {config.label}: {count}건
              </span>
            );
          })}
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === 'calendar' && (
        <CalendarGrid
          currentYear={currentYear}
          currentMonth={currentMonth}
          daysInMonth={daysInMonth}
          firstDay={firstDay}
          prevMonthDays={prevMonthDays}
          selectedDate={selectedDate}
          schedules={schedules}
          typeFilter={typeFilter}
          onDateSelect={setSelectedDate}
          onEventSelect={setSelectedEvent}
        />
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin opacity-40" />
                <p>일정을 불러오는 중...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>등록된 일정이 없습니다</p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                >
                  일정 추가하기
                </button>
              </div>
            ) : (
              filteredEvents.map((schedule) => {
                const typeKey = getEventTypeKey(schedule.schedule_type);
                const config = EVENT_TYPE_CONFIG[typeKey];
                const EventIcon = config.icon;
                const { date, time: startTime } = parseScheduleDate(schedule.start_datetime);
                const { time: endTime } = parseScheduleDate(schedule.end_datetime);
                const isPast = schedule.start_datetime ? new Date(schedule.start_datetime) < today : false;

                return (
                  <div
                    key={schedule.id}
                    onClick={() => setSelectedEvent(schedule)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${isPast ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${config.bgColor}`}>
                        <EventIcon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.bgColor} ${config.color}`}>
                            {config.label}
                          </span>
                          {schedule.status === 'pending' && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-600 rounded">대기중</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{schedule.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />{date}
                          </div>
                          {startTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {startTime}{endTime ? ` - ${endTime}` : ''}
                            </div>
                          )}
                          {schedule.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate max-w-[200px]">{schedule.location}</span>
                            </div>
                          )}
                        </div>
                        {schedule.model_name && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-purple-600">
                            <User className="w-4 h-4" />{schedule.model_name}
                          </div>
                        )}
                      </div>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* New event modal */}
      {showNewModal && (
        <ScheduleFormModal
          newEvent={newEvent}
          isSaving={isSaving}
          onClose={() => setShowNewModal(false)}
          onSave={handleCreateEvent}
          onChange={updates => setNewEvent(p => ({ ...p, ...updates }))}
        />
      )}
    </div>
  );
}

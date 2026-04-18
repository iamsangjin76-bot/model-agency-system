import React, { useState, useEffect, useCallback } from 'react';
import { schedulesAPI, Schedule } from '@/services/api';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  X,
  Camera,
  Users,
  Video,
  Mic,
  Briefcase,
  List,
  Grid3X3,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

// 일정 타입
type EventType = 'shooting' | 'meeting' | 'event' | 'audition' | 'fitting' | 'other';

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  shooting: { label: '촬영', color: 'text-red-600', bgColor: 'bg-red-100', icon: Camera },
  meeting: { label: '미팅', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Users },
  event: { label: '이벤트', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Mic },
  audition: { label: '오디션', color: 'text-green-600', bgColor: 'bg-green-100', icon: Video },
  fitting: { label: '피팅', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: User },
  other: { label: '기타', color: 'text-gray-600 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700', icon: Briefcase },
};

const getEventTypeKey = (type?: string): EventType => {
  if (type && type in EVENT_TYPE_CONFIG) return type as EventType;
  return 'other';
};

// Schedule에서 날짜/시간 파싱 헬퍼
const parseScheduleDate = (datetime?: string) => {
  if (!datetime) return { date: '', time: '' };
  const d = new Date(datetime);
  const date = d.toISOString().split('T')[0];
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
};

// 새 일정 폼 상태
interface NewEventForm {
  title: string;
  schedule_type: EventType;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  memo: string;
}

// 헬퍼 함수들
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

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
      // 현재 달 ± 1달 범위 조회
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

  // 이전/다음 달 이동
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // 캘린더 날짜 생성
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    setIsSaving(true);
    try {
      const startDatetime = newEvent.start_time
        ? `${newEvent.date}T${newEvent.start_time}:00`
        : `${newEvent.date}T00:00:00`;
      const endDatetime = newEvent.end_time
        ? `${newEvent.date}T${newEvent.end_time}:00`
        : undefined;
      await schedulesAPI.create({
        title: newEvent.title,
        schedule_type: newEvent.schedule_type,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        location: newEvent.location || undefined,
        memo: newEvent.memo || undefined,
        status: 'confirmed',
      });
      setShowNewModal(false);
      setNewEvent({ title: '', schedule_type: 'shooting', date: '', start_time: '', end_time: '', location: '', memo: '' });
      fetchSchedules();
    } catch (err) {
      console.error('일정 등록 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (dateStr: string) => {
    return schedules.filter(schedule => {
      const { date } = parseScheduleDate(schedule.start_datetime);
      const matchesDate = date === dateStr;
      const matchesType = typeFilter === 'all' || schedule.schedule_type === typeFilter;
      return matchesDate && matchesType;
    });
  };

  // 필터링된 전체 이벤트 (리스트 뷰용)
  const filteredEvents = schedules
    .filter(s => typeFilter === 'all' || s.schedule_type === typeFilter)
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  // 이번 달 일정 수
  const thisMonthEvents = schedules.filter(s => {
    const { date } = parseScheduleDate(s.start_datetime);
    const d = new Date(date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex items-center gap-4">
            {/* 월 네비게이션 */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold min-w-[140px] text-center">
                {currentYear}년 {MONTHS[currentMonth]}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              오늘
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* 타입 필터 */}
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

            {/* 뷰 모드 토글 */}
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

            {/* 새 일정 버튼 */}
            <button
              onClick={() => setShowNewModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              일정 추가
            </button>
          </div>
        </div>

        {/* 이번 달 통계 */}
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

      {/* 캘린더 뷰 */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={`py-3 text-center text-sm font-medium ${
                  idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {/* 이전 달 날짜 */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`prev-${i}`} className="min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <span className="text-gray-300 dark:text-gray-600 text-sm">{prevMonthDays - firstDay + i + 1}</span>
              </div>
            ))}

            {/* 이번 달 날짜 */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = formatDate(currentYear, currentMonth, day);
              const dayOfWeek = (firstDay + i) % 7;
              const isToday = dateStr === formatDate(today.getFullYear(), today.getMonth(), today.getDate());
              const events = getEventsForDate(dateStr);

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-purple-50/50 transition-colors ${
                    selectedDate === dateStr ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-purple-600 text-white'
                          : dayOfWeek === 0
                          ? 'text-red-500'
                          : dayOfWeek === 6
                          ? 'text-blue-500'
                          : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {day}
                    </span>
                    {events.length > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{events.length}건</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {events.slice(0, 3).map((schedule) => {
                      const config = EVENT_TYPE_CONFIG[getEventTypeKey(schedule.schedule_type)];
                      return (
                        <div
                          key={schedule.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(schedule);
                          }}
                          className={`text-xs p-1 rounded truncate ${config.bgColor} ${config.color} hover:opacity-80`}
                        >
                          {schedule.title}
                        </div>
                      );
                    })}
                    {events.length > 3 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 pl-1">+{events.length - 3}개 더보기</div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 다음 달 날짜 */}
            {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }, (_, i) => (
              <div key={`next-${i}`} className="min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <span className="text-gray-300 dark:text-gray-600 text-sm">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 리스트 뷰 */}
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

      {/* 일정 상세 모달 */}
      {selectedEvent && (() => {
        const typeKey = getEventTypeKey(selectedEvent.schedule_type);
        const config = EVENT_TYPE_CONFIG[typeKey];
        const { date, time: startTime } = parseScheduleDate(selectedEvent.start_datetime);
        const { time: endTime } = parseScheduleDate(selectedEvent.end_datetime);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden">
              <div className={`p-6 ${config.bgColor}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(config.icon, { className: `w-6 h-6 ${config.color}` })}
                    <div>
                      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedEvent.title}</h2>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-white dark:bg-gray-800/50 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">날짜</p>
                      <p className="font-medium">{date}</p>
                    </div>
                  </div>
                  {startTime && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                      <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">시간</p>
                        <p className="font-medium">{startTime}{endTime ? ` - ${endTime}` : ''}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedEvent.location && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">장소</p>
                      <p className="font-medium">{selectedEvent.location}</p>
                    </div>
                  </div>
                )}

                {selectedEvent.model_name && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">참여 모델</p>
                      <p className="font-medium">{selectedEvent.model_name}</p>
                    </div>
                  </div>
                )}

                {selectedEvent.memo && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">메모</p>
                    <p className="text-gray-700 dark:text-gray-200">{selectedEvent.memo}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  {selectedEvent.status === 'confirmed' ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm">
                      <CheckCircle2 className="w-4 h-4" />확정됨
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-600 rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4" />대기중
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900">
                <button onClick={() => setSelectedEvent(null)} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 새 일정 등록 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">일정 추가</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">새로운 일정을 등록합니다</p>
                </div>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">일정 제목 *</label>
                <input
                  type="text"
                  placeholder="일정 제목을 입력하세요"
                  value={newEvent.title}
                  onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">일정 유형 *</label>
                <select
                  value={newEvent.schedule_type}
                  onChange={e => setNewEvent(p => ({ ...p, schedule_type: e.target.value as EventType }))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">날짜 *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">시작</label>
                    <input
                      type="time"
                      value={newEvent.start_time}
                      onChange={e => setNewEvent(p => ({ ...p, start_time: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">종료</label>
                    <input
                      type="time"
                      value={newEvent.end_time}
                      onChange={e => setNewEvent(p => ({ ...p, end_time: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">장소</label>
                <input
                  type="text"
                  placeholder="장소를 입력하세요"
                  value={newEvent.location}
                  onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">메모</label>
                <textarea
                  rows={3}
                  placeholder="상세 내용을 입력하세요"
                  value={newEvent.memo}
                  onChange={e => setNewEvent(p => ({ ...p, memo: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                취소
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={isSaving || !newEvent.title.trim() || !newEvent.date}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSaving ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Schedule } from '@/services/api';
import { EVENT_TYPE_CONFIG, getEventTypeKey, formatDate, WEEKDAYS, EventType } from './ScheduleConstants';

interface Props {
  currentYear: number;
  currentMonth: number;
  daysInMonth: number;
  firstDay: number;
  prevMonthDays: number;
  selectedDate: string | null;
  schedules: Schedule[];
  typeFilter: EventType | 'all';
  onDateSelect: (date: string) => void;
  onEventSelect: (schedule: Schedule) => void;
}

export function CalendarGrid({
  currentYear, currentMonth, daysInMonth, firstDay, prevMonthDays,
  selectedDate, schedules, typeFilter, onDateSelect, onEventSelect,
}: Props) {
  const today = new Date();

  const getEventsForDate = (dateStr: string) => {
    return schedules.filter(schedule => {
      const d = schedule.start_datetime ? new Date(schedule.start_datetime) : null;
      if (!d) return false;
      const date = d.toISOString().split('T')[0];
      const matchesDate = date === dateStr;
      const matchesType = typeFilter === 'all' || schedule.schedule_type === typeFilter;
      return matchesDate && matchesType;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Weekday header */}
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

      {/* Date grid */}
      <div className="grid grid-cols-7">
        {/* Previous month dates */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`prev-${i}`} className="min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <span className="text-gray-300 dark:text-gray-600 text-sm">{prevMonthDays - firstDay + i + 1}</span>
          </div>
        ))}

        {/* Current month dates */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = formatDate(currentYear, currentMonth, day);
          const dayOfWeek = (firstDay + i) % 7;
          const isToday = dateStr === formatDate(today.getFullYear(), today.getMonth(), today.getDate());
          const events = getEventsForDate(dateStr);

          return (
            <div
              key={day}
              onClick={() => onDateSelect(dateStr)}
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
                        onEventSelect(schedule);
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

        {/* Next month dates */}
        {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }, (_, i) => (
          <div key={`next-${i}`} className="min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <span className="text-gray-300 dark:text-gray-600 text-sm">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { Schedule } from '@/services/api';
import { EVENT_TYPE_CONFIG, getEventTypeKey, parseScheduleDate } from './ScheduleConstants';
import { Calendar as CalendarIcon, Clock, MapPin, User, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  event: Schedule;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: Props) {
  const typeKey = getEventTypeKey(event.schedule_type);
  const config = EVENT_TYPE_CONFIG[typeKey];
  const { date, time: startTime } = parseScheduleDate(event.start_datetime);
  const { time: endTime } = parseScheduleDate(event.end_datetime);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden">
        <div className={`p-6 ${config.bgColor}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {React.createElement(config.icon, { className: `w-6 h-6 ${config.color}` })}
              <div>
                <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{event.title}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white dark:bg-gray-800/50 rounded-lg transition-colors">
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

          {event.location && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">장소</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>
          )}

          {event.model_name && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">참여 모델</p>
                <p className="font-medium">{event.model_name}</p>
              </div>
            </div>
          )}

          {event.memo && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">메모</p>
              <p className="text-gray-700 dark:text-gray-200">{event.memo}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            {event.status === 'confirmed' ? (
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
          <button onClick={onClose} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

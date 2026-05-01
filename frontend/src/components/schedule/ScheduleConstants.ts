// Schedule event type config and calendar helper utilities.
import React from 'react';
import { Camera, Users, Mic, Video, User, Briefcase } from 'lucide-react';

export type EventType = 'shooting' | 'meeting' | 'event' | 'audition' | 'fitting' | 'other';

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  shooting: { label: '촬영', color: 'text-red-600', bgColor: 'bg-red-100', icon: Camera },
  meeting: { label: '미팅', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Users },
  event: { label: '이벤트', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Mic },
  audition: { label: '오디션', color: 'text-green-600', bgColor: 'bg-green-100', icon: Video },
  fitting: { label: '피팅', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: User },
  other: { label: '기타', color: 'text-gray-600 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700', icon: Briefcase },
};

export const getEventTypeKey = (type?: string): EventType => {
  if (type && type in EVENT_TYPE_CONFIG) return type as EventType;
  return 'other';
};

export const parseScheduleDate = (datetime?: string) => {
  if (!datetime) return { date: '', time: '' };
  const d = new Date(datetime);
  const date = d.toISOString().split('T')[0];
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
};

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export const formatDate = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export interface NewEventForm {
  title: string;
  schedule_type: EventType;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  memo: string;
}

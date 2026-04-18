import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center space-y-4 p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
        <MapPin className="w-12 h-12 text-purple-400 mx-auto" />
        <p className="text-6xl font-black text-gray-200 dark:text-gray-700 select-none">
          404
        </p>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          요청하신 주소가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}

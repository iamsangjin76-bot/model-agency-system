import React from 'react';
import { ClientItem, GRADE_CONFIG, INDUSTRIES, ClientGrade, Industry } from './ClientConstants';
import { User, Phone, Mail, MapPin, TrendingUp, FileText, Edit, Star, StarOff, Trash2, X, Briefcase } from 'lucide-react';

interface Props {
  client: ClientItem;
  onClose: () => void;
}

export function ClientDetailModal({ client, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Modal header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-2xl font-bold">
                {client.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{client.name}</h2>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    {client.is_favorite ? (
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    ) : (
                      <StarOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {client.grade && GRADE_CONFIG[client.grade as ClientGrade] && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${GRADE_CONFIG[client.grade as ClientGrade].bgColor} ${GRADE_CONFIG[client.grade as ClientGrade].color}`}>
                      {GRADE_CONFIG[client.grade as ClientGrade].label}
                    </span>
                  )}
                  {client.industry && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">{INDUSTRIES[client.industry as Industry] || client.industry}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                연락처 정보
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
                {client.contact_name && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="font-medium">{client.contact_name}</p>
                      {client.contact_position && <p className="text-sm text-gray-500 dark:text-gray-400">{client.contact_position}</p>}
                    </div>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm">{client.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                거래 정보
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">총 프로젝트</span>
                  <span className="font-semibold text-lg">{client.total_projects || 0}건</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">누적 거래액</span>
                  <span className="font-semibold text-lg text-green-600">{(client.total_amount || 0).toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* Memo */}
            {client.memo && (
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  메모
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-gray-600 dark:text-gray-300">{client.memo}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-gray-50 dark:bg-gray-900">
          <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              캐스팅 요청
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
              수정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

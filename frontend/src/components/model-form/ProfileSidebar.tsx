import React, { useState } from 'react';
import { Camera, Upload, X, Plus, User } from 'lucide-react';
import { Model, ModelType, MODEL_TYPE_LABELS } from '@/types/model';
import { FormField, selectClass } from './FormParts';

interface Props {
  isEdit: boolean;
  formData: Partial<Model>;
  profileImages: string[];
  additionalImages: { id: number; file_path: string; file_name: string; file_size: number }[];
  uploadingImage: boolean;
  uploadingAdditional: boolean;
  previewImage: string | null;
  currentFileInfo: { name: string; size: number } | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdditionalUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAdditional: (e: React.MouseEvent, fileId: number) => void;
  onPreviewChange: (url: string | null) => void;
  onFieldChange: (field: keyof Model, value: any) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export default function ProfileSidebar({
  isEdit, formData, profileImages, additionalImages,
  uploadingImage, uploadingAdditional, previewImage, currentFileInfo,
  onImageUpload, onAdditionalUpload, onDeleteAdditional, onPreviewChange, onFieldChange,
}: Props) {
  const displayedImage = previewImage ?? profileImages[0] ?? null;

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-purple-600" />
          프로필 이미지
        </h3>

        {/* Main profile image */}
        <div
          className={`aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-4 relative group ${previewImage ? 'cursor-pointer' : ''}`}
          onClick={() => previewImage && onPreviewChange(null)}
        >
          {displayedImage ? (
            <img src={displayedImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1 px-4">
              <Camera className="w-12 h-12 mb-1 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">프로필 사진</p>
              <p className="text-xs text-gray-400 text-center">800 × 1200px 권장</p>
              <p className="text-xs text-gray-400 text-center">JPEG, PNG, WebP / 최대 10MB</p>
            </div>
          )}
          {!previewImage && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label
                className="px-4 py-2 bg-white rounded-lg font-medium text-gray-800 flex items-center gap-2 cursor-pointer"
                onClick={e => e.stopPropagation()}
              >
                <Upload className="w-4 h-4" />
                {uploadingImage ? '업로드 중...' : '업로드'}
                <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} disabled={uploadingImage} />
              </label>
            </div>
          )}
          {previewImage && (
            <div className="absolute top-2 left-2 right-2 flex justify-center pointer-events-none">
              <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">← 클릭하여 복귀</span>
            </div>
          )}
        </div>

        {/* File info */}
        {currentFileInfo && (
          <p className="text-xs text-gray-500 text-center mt-1 mb-2 truncate px-1" title={currentFileInfo.name}>
            {currentFileInfo.name} · {formatFileSize(currentFileInfo.size)}
          </p>
        )}

        {/* Additional image thumbnails */}
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => {
            const img = additionalImages[i];
            const isActive = img ? img.file_path === previewImage : false;
            return (
              <div
                key={i}
                className={`aspect-square bg-gray-100 rounded-lg overflow-hidden relative group transition-all ${img ? `cursor-pointer ${isActive ? 'ring-2 ring-purple-500' : 'hover:ring-2 hover:ring-purple-400'}` : 'hover:ring-2 hover:ring-purple-400'}`}
                onClick={() => img && onPreviewChange(isActive ? null : img.file_path)}
              >
                {img ? (
                  <>
                    <img src={img.file_path} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => onDeleteAdditional(e, img.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex items-center justify-center text-gray-400 cursor-pointer" onClick={e => e.stopPropagation()}>
                    {uploadingAdditional
                      ? <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      : <Plus className="w-4 h-4" />}
                    <input type="file" accept="image/*" className="hidden" onChange={onAdditionalUpload} disabled={!isEdit || uploadingAdditional} />
                  </label>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">JPEG, PNG, WebP / 최대 10MB</p>

        {/* Model type select */}
        <div className="mt-6">
          <FormField label="모델 유형" required>
            <select value={formData.modelType} onChange={e => onFieldChange('modelType', e.target.value)} className={selectClass}>
              {Object.entries(MODEL_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Active toggle */}
        <div className="mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={e => onFieldChange('isActive', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="font-medium text-gray-700">활성 상태</span>
          </label>
        </div>
      </div>
    </div>
  );
}

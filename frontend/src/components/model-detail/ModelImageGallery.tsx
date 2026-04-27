import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Trash2, Star, X } from 'lucide-react';
import { imageSearchAPI, SavedSearchImage } from '@/services/domain-api';
import { useToast } from '@/contexts/ToastContext';
import { proxify, handleImgError } from '@/utils/imageProxy';
import DetailSection from './DetailSection';

interface Props {
  modelId: number;
}

function imageUrl(localPath: string): string {
  if (!localPath) return '';
  // Use /uploads/ proxy configured in vite.config.ts
  return `/uploads/${localPath.replace(/^\/+/, '')}`;
}

export default function ModelImageGallery({ modelId }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<SavedSearchImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<SavedSearchImage | null>(null);

  useEffect(() => {
    imageSearchAPI.getByModel(modelId)
      .then(res => setItems(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [modelId]);

  const handleDelete = async (imageId: number) => {
    if (!window.confirm('이 이미지를 삭제하시겠습니까?')) return;
    try {
      await imageSearchAPI.delete(imageId);
      setItems(prev => prev.filter(img => img.id !== imageId));
      if (preview?.id === imageId) setPreview(null);
      toast.success('이미지가 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleToPortfolio = async (imageId: number) => {
    try {
      await imageSearchAPI.toPortfolio(imageId);
      setItems(prev => prev.map(img => img.id === imageId ? { ...img, is_portfolio: true } : img));
      if (preview?.id === imageId) setPreview(prev => prev ? { ...prev, is_portfolio: true } : null);
      toast.success('포트폴리오에 등록되었습니다.');
    } catch {
      toast.error('포트폴리오 등록에 실패했습니다.');
    }
  };

  return (
    <>
      <DetailSection title="검색 이미지 갤러리" icon={ImageIcon}>
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">불러오는 중...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <ImageIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              저장된 이미지가 없습니다.<br />
              이미지 검색 페이지에서 이미지를 검색하고 저장해보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {items.map(img => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-[3/4]">
                {/* Thumbnail */}
                <img
                  src={proxify(imageUrl(img.local_path))}
                  alt={img.source}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreview(img)}
                  loading="lazy"
                  onError={handleImgError}
                />

                {/* Portfolio badge */}
                {img.is_portfolio && (
                  <div className="absolute top-1.5 left-1.5">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full">
                      <Star className="w-3 h-3" />포트폴리오
                    </span>
                  </div>
                )}

                {/* Hover action buttons */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(img.id); }}
                      className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {!img.is_portfolio && (
                      <button
                        onClick={e => { e.stopPropagation(); handleToPortfolio(img.id); }}
                        className="p-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        title="포트폴리오 등록"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Source label */}
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-xs truncate">{img.source}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      {/* Fullscreen preview overlay */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setPreview(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img
              src={proxify(imageUrl(preview.local_path))}
              alt={preview.source}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onError={handleImgError}
            />
            <div className="mt-3 flex items-center justify-between text-white">
              <div>
                <p className="text-sm text-gray-300">{preview.source}</p>
                {preview.width > 0 && (
                  <p className="text-xs text-gray-400">{preview.width} × {preview.height} · {(preview.file_size / 1024).toFixed(0)}KB</p>
                )}
              </div>
              <div className="flex gap-2">
                {!preview.is_portfolio && (
                  <button
                    onClick={() => handleToPortfolio(preview.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-lg transition-colors"
                  >
                    <Star className="w-4 h-4" />포트폴리오 등록
                  </button>
                )}
                <button
                  onClick={() => handleDelete(preview.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

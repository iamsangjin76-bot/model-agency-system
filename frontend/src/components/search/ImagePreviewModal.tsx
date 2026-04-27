import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { SearchImage } from '@/services/domain-api';
import { handleImgError } from '@/utils/imageProxy';

interface Props {
  image: SearchImage;
  isChecked: boolean;
  onClose: () => void;
  onToggleCheck: () => void;
}

export default function ImagePreviewModal({ image, isChecked, onClose, onToggleCheck }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        onClick={onClose}
      >
        <X className="w-8 h-8" />
      </button>

      <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
        <img
          src={image.original_url || ""}
          alt={image.source}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
          onError={handleImgError}
        />
        <div className="mt-4 flex items-center justify-between text-white">
          <div>
            <p className="text-sm text-gray-300">{image.source}</p>
            {image.width > 0 && (
              <p className="text-sm text-gray-400">{image.width} × {image.height}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleCheck}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isChecked ? 'bg-purple-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              {isChecked ? '선택됨' : '선택'}
            </button>
            <a
              href={image.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />원본
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

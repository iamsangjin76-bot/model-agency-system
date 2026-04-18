import React from 'react';
import { Check, ZoomIn } from 'lucide-react';
import { SearchImage } from '@/services/domain-api';

interface Props {
  image: SearchImage;
  index: number;
  isChecked: boolean;
  onToggle: (index: number) => void;
  onPreview: (image: SearchImage) => void;
}

export default function ImageResultCard({ image, index, isChecked, onToggle, onPreview }: Props) {
  return (
    <div
      className={`relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-[3/4] cursor-pointer ${
        isChecked ? 'ring-4 ring-purple-500' : ''
      }`}
      onClick={() => onToggle(index)}
    >
      <img
        src={image.thumbnailUrl}
        alt={image.source}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors ${
          isChecked ? 'bg-black/20' : ''
        }`}
      >
        {/* Checkbox indicator */}
        <div className="absolute top-2 left-2">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              isChecked
                ? 'bg-purple-600 border-purple-600'
                : 'border-white bg-black/30 group-hover:bg-white/80'
            }`}
          >
            {isChecked && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>

        {/* Preview button */}
        <button
          onClick={e => { e.stopPropagation(); onPreview(image); }}
          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Source label */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-white text-xs truncate">{image.source}</p>
        {image.width > 0 && (
          <p className="text-white/70 text-xs">{image.width} × {image.height}</p>
        )}
      </div>
    </div>
  );
}

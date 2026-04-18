import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Parse a keywords string into an array of tags (with # prefix stripped). */
function parseTags(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map(t => t.replace(/^#/, '').trim())
    .filter(Boolean);
}

/** Serialize tags back to "#tag1 #tag2" format. */
function serializeTags(tags: string[]): string {
  return tags.map(t => `#${t}`).join(' ');
}

export default function KeywordTagInput({ value, onChange }: Props) {
  const [inputValue, setInputValue] = useState('');
  const tags = parseTags(value);

  const addTag = useCallback((raw: string) => {
    const tag = raw.replace(/^#/, '').replace(/,/g, '').trim();
    if (!tag || tags.includes(tag)) return;
    onChange(serializeTags([...tags, tag]));
  }, [tags, onChange]);

  const removeTag = useCallback((idx: number) => {
    const next = tags.filter((_, i) => i !== idx);
    onChange(serializeTags(next));
  }, [tags, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue('');
      }
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all flex flex-wrap gap-2 min-h-[44px]">
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="p-0.5 hover:bg-purple-200 rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm py-1"
        placeholder={tags.length === 0 ? '키워드 입력 후 Enter (예: 청순한)' : ''}
      />
    </div>
  );
}

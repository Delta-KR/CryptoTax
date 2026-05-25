'use client';
import { useCallback, useRef, useState, type DragEvent, type ChangeEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// 서버 측 한도와 동기화 (lib/validation/calculate.ts MAX_FILE_BYTES).
const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface FileDropProps {
  onFile: (file: File) => void;
  onReject?: (reason: string) => void;
  accept?: string;
  title?: string;
  description?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function FileDrop({
  onFile,
  onReject,
  accept = '.csv,.pdf,.xls,.xlsx',
  title = '파일을 끌어다 놓거나 클릭해서 선택',
  description = 'CSV · PDF · XLS · XLSX 지원',
  className,
  disabled,
}: FileDropProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;
      const file = files[0];
      if (file.size > MAX_FILE_BYTES) {
        onReject?.(
          `파일이 너무 커요 (${(file.size / 1024 / 1024).toFixed(1)}MB). ${MAX_FILE_BYTES / 1024 / 1024}MB 이하만 가능해요.`,
        );
        return;
      }
      onFile(file);
    },
    [onFile, onReject, disabled]
  );

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    // clear value so same file can re-trigger
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors',
        dragging
          ? 'border-brand bg-brand-faint'
          : 'border-line bg-bg-soft hover:border-brand/40 hover:bg-brand-faint/50',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-faint text-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 16V4M12 4l-4 4M12 4l4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <div className="text-[15px] font-semibold text-ink">{title}</div>
        {description && (
          <div className="mt-1 text-[12px] text-muted">{description}</div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="sr-only"
        disabled={disabled}
      />
    </label>
  );
}

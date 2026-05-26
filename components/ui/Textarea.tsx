'use client';
import { useId, type TextareaHTMLAttributes, type Ref } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({
  label,
  helper,
  error,
  id,
  className,
  ref,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const ta = id ?? generatedId;
  const helperId = `${ta}-helper`;
  const errorId = `${ta}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={ta} className="text-[13px] font-medium text-ink-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={ta}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : helper ? helperId : undefined}
        className={cn(
          'w-full rounded-sm border bg-card px-3.5 py-2.5 text-body text-ink placeholder:text-muted-2 transition-colors',
          'focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
          'min-h-[88px] resize-y',
          error ? 'border-bad' : 'border-line',
          className
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-[12px] text-bad">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="text-[12px] text-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

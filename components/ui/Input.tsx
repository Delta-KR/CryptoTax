'use client';
import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  label,
  helper,
  error,
  leftIcon,
  rightSlot,
  id,
  className,
  ref,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helper ? helperId : undefined}
          className={cn(
            'w-full rounded-sm border bg-card px-3.5 py-2.5 text-body text-ink placeholder:text-muted-2 transition-colors',
            'focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
            error ? 'border-bad' : 'border-line',
            leftIcon && 'pl-10',
            rightSlot && 'pr-10',
            className
          )}
          {...props}
        />
        {rightSlot && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
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

'use client';
import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({ label, id, className, ref, ...props }: CheckboxProps) {
  const generatedId = useId();
  const cbId = id ?? generatedId;
  return (
    <label
      htmlFor={cbId}
      className="inline-flex cursor-pointer items-center gap-2.5 text-[14px] text-ink-2"
    >
      <input
        ref={ref}
        id={cbId}
        type="checkbox"
        className={cn('peer sr-only', className)}
        {...props}
      />
      <span
        aria-hidden="true"
        className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border border-line bg-card transition-colors peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 peer-checked:[&_svg]:opacity-100"
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          className="opacity-0 transition-opacity"
        >
          <path
            d="M4 8L7 11L12 5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

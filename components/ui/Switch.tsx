'use client';
import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Switch({ label, id, className, ref, ...props }: SwitchProps) {
  const generatedId = useId();
  const swId = id ?? generatedId;
  return (
    <label
      htmlFor={swId}
      className="inline-flex cursor-pointer items-center gap-3 text-[14px] text-ink-2"
    >
      <input
        ref={ref}
        id={swId}
        type="checkbox"
        role="switch"
        className={cn('peer sr-only', className)}
        {...props}
      />
      <span
        aria-hidden="true"
        className="relative h-5 w-9 flex-shrink-0 rounded-full bg-line transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 peer-checked:[&>span]:translate-x-4"
      >
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform" />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

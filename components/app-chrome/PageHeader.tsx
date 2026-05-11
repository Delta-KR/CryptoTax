import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  right?: ReactNode;
}

export function PageHeader({ title, description, right }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tighter3 text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-body text-muted">{description}</p>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}

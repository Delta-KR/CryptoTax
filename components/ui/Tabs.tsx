'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onChange: (v: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs>');
  return ctx;
}

export function Tabs({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={cn('flex flex-col gap-4', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex flex-wrap gap-1 self-start rounded-sm bg-bg-tint p-1', className)}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value: triggerValue,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useTabsContext();
  const active = ctx.value === triggerValue;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.onChange(triggerValue)}
      className={cn(
        'rounded-[6px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
        active
          ? 'bg-card text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
          : 'bg-transparent text-muted hover:text-ink-2',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value: contentValue,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useTabsContext();
  if (ctx.value !== contentValue) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}

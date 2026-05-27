import Link from 'next/link';

export function BlurOverlay({
  children,
  masked,
  href = '/billing',
}: {
  children: React.ReactNode;
  masked: boolean;
  href?: string;
}) {
  if (!masked) return <>{children}</>;
  return (
    <Link href={href} className="group relative block">
      <div className="pointer-events-none select-none blur-[10px]" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-gradient-to-br from-brand/15 via-transparent to-brand/15 transition-colors group-hover:from-brand/25 group-hover:to-brand/25">
        <div
          className="rounded-full bg-brand px-3.5 py-1.5 text-[11.5px] font-extrabold text-white shadow-brand-glow transition-colors hover:bg-brand-2"
        >
          프리미엄 전용
        </div>
      </div>
    </Link>
  );
}

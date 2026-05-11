// Stub page placeholder used until each phase builds out the real page.
export function Placeholder({
  phase,
  title,
  description,
}: {
  phase: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <p className="text-eyebrow uppercase text-brand">{phase}</p>
      <h1 className="mt-3 text-[32px] font-extrabold tracking-tighter3 text-ink">
        {title}
      </h1>
      {description && (
        <p className="mt-4 text-body-lead text-muted">{description}</p>
      )}
    </div>
  );
}

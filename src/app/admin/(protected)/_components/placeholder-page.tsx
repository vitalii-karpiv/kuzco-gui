import { type LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  /** Section title (Ukrainian). */
  title: string;
  /** The route this screen lives at, shown as a mono breadcrumb. */
  route: string;
  /** Short Ukrainian description of what will live here. */
  description: string;
  icon: LucideIcon;
}

/**
 * Intentionally-designed "under construction" screen shared by every admin
 * section until its real content lands. No data, no logic — just the shell.
 */
export function PlaceholderPage({
  title,
  route,
  description,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
      <span className="grid size-16 place-items-center rounded-2xl border border-paper-line bg-white shadow-sm">
        <Icon className="size-7 text-ink-soft" strokeWidth={1.75} />
      </span>

      <p className="mt-6 font-mono text-xs tracking-[0.15em] text-ink-soft">
        {route}
      </p>

      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink">
        {title}
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
        {description}
      </p>

      <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-paper-line bg-white px-3 py-1 font-mono text-[10px] font-medium tracking-[0.2em] text-ink-soft uppercase">
        <span className="size-1.5 rounded-full bg-amber" />
        Заглушка — без логіки
      </span>
    </div>
  );
}

/**
 * Single color-coded lifecycle tag shared across every domain (requirements
 * §CC-3). Callers pass the resolved label + hex color from their domain map.
 */
export function StateTag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ color, backgroundColor: `${color}1f` }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

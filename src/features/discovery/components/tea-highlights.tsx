// Short, data-backed claims about a tea; nothing renders when it has none.
export function TeaHighlights({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <section aria-label="Highlights">
      <ul className="flex flex-wrap gap-2">
        {lines.map((line) => (
          <li
            key={line}
            className="bg-brand/10 text-brand rounded-full px-3 py-1.5 text-sm font-semibold"
          >
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

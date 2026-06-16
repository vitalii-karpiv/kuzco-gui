"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { laptopService } from "@/shared/api/laptop-service";
import { ACTIVE_LAPTOP_STATES, type Laptop } from "@/shared/domain/laptop";

const fieldClass =
  "w-full rounded-lg border border-paper-line bg-paper/40 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent";

interface LaptopPickerProps {
  /** Currently selected laptop id, or `null` when none. */
  value: string | null;
  onChange: (laptopId: string | null) => void;
}

/** Searchable laptop selector — books a stock item to a laptop or releases it. */
export function LaptopPicker({ value, onChange }: LaptopPickerProps) {
  const [selected, setSelected] = useState<Laptop | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Laptop[]>([]);
  const [open, setOpen] = useState(false);

  // Resolve the chip label whenever the bound id changes (e.g. opening an edit).
  useEffect(() => {
    let active = true;
    if (!value) {
      // Defer so we never setState synchronously in the effect body.
      Promise.resolve().then(() => {
        if (active) setSelected(null);
      });
      return () => {
        active = false;
      };
    }
    if (selected?._id === value) return;
    laptopService
      .get(value)
      .then((laptop) => {
        if (active) setSelected(laptop);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced search while typing.
  useEffect(() => {
    let active = true;
    if (selected || query.trim() === "") {
      Promise.resolve().then(() => {
        if (active) setResults([]);
      });
      return () => {
        active = false;
      };
    }
    const id = setTimeout(() => {
      laptopService
        .list({ name: query.trim(), stateList: ACTIVE_LAPTOP_STATES })
        .then((list) => {
          if (active) setResults(list);
        })
        .catch(() => {});
    }, 300);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [query, selected]);

  function pick(laptop: Laptop) {
    setSelected(laptop);
    setQuery("");
    setResults([]);
    setOpen(false);
    onChange(laptop._id);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    setResults([]);
    onChange(null);
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-paper-line bg-paper/40 px-3 py-2">
        <span className="truncate text-sm text-ink">
          <span className="font-mono text-xs text-ink-soft">
            {selected.code}
          </span>{" "}
          — {selected.name}
        </span>
        <button
          type="button"
          onClick={clear}
          aria-label="Відв'язати ноутбук"
          className="rounded p-0.5 text-ink-soft transition-colors hover:text-red-600"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Пошук ноутбука за назвою або кодом…"
        className={`${fieldClass} pl-9`}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-paper-line bg-white py-1 shadow-lg">
          {results.map((laptop) => (
            <li key={laptop._id}>
              <button
                type="button"
                onClick={() => pick(laptop)}
                className="block w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-paper"
              >
                <span className="font-mono text-xs text-ink-soft">
                  {laptop.code}
                </span>{" "}
                — {laptop.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

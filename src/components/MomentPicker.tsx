import { useEffect, useRef, useState } from 'react';
import { cx } from '../lib/utils';
import { Icon } from './Icon';

interface MomentPickerProps {
  value: string;
  suggestions: string[];
  onChange: (value: string) => void;
}

export function MomentPicker({ value, suggestions, onChange }: MomentPickerProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const normalized = query.trim().toLowerCase();
  const filtered = suggestions.filter((label) => label.toLowerCase().includes(normalized));
  const isNew = query.trim().length > 0 && !suggestions.some((label) => label === query.trim());

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cx(
          'flex items-center gap-2 rounded-lg border bg-surface px-3 transition-colors',
          open ? 'border-accent' : 'border-line',
        )}
      >
        <Icon name="clock" size={15} className="text-ink-faint" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            if (next.trim() !== '') onChange(next);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (query.trim() === '' && value !== '') {
              setQuery(value);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              inputRef.current?.blur();
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Es. Giorno 1 - Alba"
          aria-label="Momento nella timeline"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        {query.trim() ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
              setOpen(false);
            }}
            title="Rimuovi il momento dalla timeline"
            aria-label="Rimuovi il momento dalla timeline"
            className="rounded-full p-1 text-ink-faint transition-colors hover:text-ink"
          >
            <Icon name="x" size={13} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          title="Mostra i momenti già usati"
          aria-label="Mostra i momenti già usati"
          className="rounded p-0.5 text-ink-faint transition-colors hover:text-ink"
        >
          <Icon name="chevron-down" size={15} />
        </button>
      </div>

      {open ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-float">
          {filtered.length > 0 ? (
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.map((label) => (
                <li key={label}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setQuery(label);
                      onChange(label);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-soft transition-colors hover:bg-surface2 hover:text-ink"
                  >
                    <Icon name="clock" size={13} className="shrink-0 text-ink-faint" />
                    <span className="flex-1 truncate">{label}</span>
                    {label === value.trim() ? (
                      <Icon name="check" size={13} className="text-accent" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {isNew ? (
            <div
              className={cx(
                'px-3 py-2 text-[11px] text-ink-faint',
                filtered.length > 0 && 'border-t border-line',
              )}
            >
              Nuovo momento: <span className="font-medium text-ink">«{query.trim()}»</span>
            </div>
          ) : null}
          {!isNew && filtered.length === 0 ? (
            <p className="px-3 py-3 text-xs leading-relaxed text-ink-faint">
              Nessun momento salvato con questo nome. Scrivi un'etichetta per crearne uno nuovo.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

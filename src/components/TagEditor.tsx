import { useMemo, useState } from 'react';
import type { Tag } from '../shared/types';
import { TAG_COLORS, TAG_COLOR_NAMES, createTag } from '../lib/factory';
import { cx } from '../lib/utils';
import { Icon } from './Icon';
import { Button, TagChip } from './ui';

interface TagEditorProps {
  tags: Tag[];
  palette: Tag[];
  onChange: (tags: Tag[]) => void;
}

export function TagEditor({ tags, palette, onChange }: TagEditorProps) {
  const [open, setOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState(TAG_COLORS[0]);

  const available = useMemo(() => {
    const usedNames = new Set(tags.map((tag) => tag.name.toLowerCase()));
    const seen = new Set<string>();
    const merged: Tag[] = [];
    for (const tag of palette) {
      const key = tag.name.toLowerCase();
      if (usedNames.has(key) || seen.has(key)) continue;
      seen.add(key);
      merged.push(tag);
    }
    return merged;
  }, [palette, tags]);

  const addTag = (tag: Tag) => {
    if (tags.some((current) => current.name.toLowerCase() === tag.name.toLowerCase())) return;
    onChange([...tags, tag]);
  };

  const handleCreate = () => {
    const name = customName.trim();
    if (!name) return;
    const existing = palette.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
    addTag(existing ?? createTag(name, customColor));
    setCustomName('');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            onRemove={() => onChange(tags.filter((current) => current.id !== tag.id))}
          />
        ))}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className={cx(
            'inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[11.5px] font-medium transition-colors',
            open
              ? 'border-accent text-accent-ink'
              : 'border-line text-ink-faint hover:border-ink-faint hover:text-ink',
          )}
        >
          <Icon name="plus" size={11} strokeWidth={2} />
          Tag
        </button>
      </div>

      {open ? (
        <div className="mt-2.5 animate-fade-in rounded-xl border border-line bg-surface p-3 shadow-card">
          {available.length > 0 ? (
            <div>
              <p className="label mb-2">Tag disponibili</p>
              <div className="flex flex-wrap gap-1.5">
                {available.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-[11.5px] text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={cx('space-y-2', available.length > 0 && 'mt-3 border-t border-line pt-3')}>
            <p className="label">Crea un tag personalizzato</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleCreate();
                  }
                }}
                placeholder="Nome del tag"
                maxLength={28}
                className="field-input h-8 min-w-[130px] flex-1 py-1 text-[13px]"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={handleCreate}
                disabled={!customName.trim()}
              >
                <Icon name="plus" size={13} />
                Aggiungi
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TAG_COLORS.map((color, index) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCustomColor(color)}
                  title={TAG_COLOR_NAMES[index]}
                  aria-label={`Colore ${TAG_COLOR_NAMES[index]}`}
                  aria-pressed={customColor === color}
                  className={cx(
                    'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                    customColor === color ? 'border-ink' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

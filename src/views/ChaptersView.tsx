import { useState } from 'react';
import type { Chapter, Story } from '../shared/types';
import { newChapter } from '../lib/factory';
import {
  chaptersLabel,
  countWords,
  cx,
  formatNumber,
  wordsLabel,
} from '../lib/utils';
import { MomentPicker } from '../components/MomentPicker';
import { RichTextEditor } from '../components/RichTextEditor';
import { TagEditor } from '../components/TagEditor';
import { Icon } from '../components/Icon';
import { contentToPlainText } from '../lib/richText';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
} from '../components/ui';

interface ChaptersViewProps {
  story: Story;
  palette: Story['tags'];
  selectedChapterId: string | null;
  onSelectChapter: (chapterId: string | null) => void;
  updateStory: (storyId: string, updater: (story: Story) => Story) => void;
}

export function ChaptersView({
  story,
  palette,
  selectedChapterId,
  onSelectChapter,
  updateStory,
}: ChaptersViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<Chapter | null>(null);

  const selected =
    story.chapters.find((chapter) => chapter.id === selectedChapterId) ?? story.chapters[0] ?? null;
  const selectedIndex = selected
    ? story.chapters.findIndex((chapter) => chapter.id === selected.id)
    : -1;
  const totalWords = story.chapters.reduce((sum, chapter) => sum + countWords(chapter.content), 0);

  const addChapter = () => {
    const chapter = newChapter(story.chapters.length + 1);
    updateStory(story.id, (current) => ({
      ...current,
      chapters: [...current.chapters, chapter],
    }));
    onSelectChapter(chapter.id);
  };

  const moveChapter = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= story.chapters.length) return;
    updateStory(story.id, (current) => {
      const chapters = [...current.chapters];
      const [moved] = chapters.splice(index, 1);
      chapters.splice(target, 0, moved);
      return { ...current, chapters };
    });
  };

  const deleteChapter = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const index = story.chapters.findIndex((chapter) => chapter.id === target.id);
    const remaining = story.chapters.filter((chapter) => chapter.id !== target.id);
    setDeleteTarget(null);
    updateStory(story.id, (current) => ({
      ...current,
      chapters: current.chapters.filter((chapter) => chapter.id !== target.id),
      timeline: current.timeline.filter((event) => event.chapterId !== target.id),
      characters: current.characters.map((character) => ({
        ...character,
        chapterIds: character.chapterIds.filter((chapterId) => chapterId !== target.id),
      })),
    }));
    const neighbour = remaining[Math.max(0, Math.min(index, remaining.length - 1))];
    onSelectChapter(neighbour ? neighbour.id : null);
  };

  const timelineLabels = Array.from(new Set(story.timeline.map((event) => event.label))).filter(
    Boolean,
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="card flex flex-col overflow-hidden lg:sticky lg:top-[126px] lg:max-h-[calc(100vh-150px)]">
        <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3.5">
          <div>
            <h2 className="font-serif text-lg leading-none text-ink">Capitoli</h2>
            <p className="mt-1.5 text-[11px] text-ink-faint">
              {chaptersLabel(story.chapters.length)} · {wordsLabel(totalWords)}
            </p>
          </div>
          <IconButton label="Aggiungi capitolo" onClick={addChapter}>
            <Icon name="plus" size={16} />
          </IconButton>
        </div>

        {story.chapters.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-ink-soft">Non hai ancora scritto nessun capitolo.</p>
            <Button size="sm" variant="primary" className="mt-3" onClick={addChapter}>
              <Icon name="plus" size={14} />
              Aggiungi il primo
            </Button>
          </div>
        ) : (
          <ul className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2">
            {story.chapters.map((chapter, index) => {
              const active = selected?.id === chapter.id;
              const words = countWords(chapter.content);
              return (
                <li key={chapter.id}>
                  <div
                    className={cx(
                      'group flex items-start gap-1 rounded-xl border p-1.5 transition-colors',
                      active
                        ? 'border-line bg-accent-soft'
                        : 'border-transparent hover:bg-surface2',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectChapter(chapter.id)}
                      className="flex min-w-0 flex-1 items-start gap-2 rounded-lg p-1 text-left focus-visible:outline-none"
                      aria-current={active ? 'true' : undefined}
                    >
                      <span
                        className={cx(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10.5px] font-semibold tabular-nums',
                          active
                            ? 'border-accent text-accent-ink'
                            : 'border-line text-ink-faint',
                        )}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium leading-snug text-ink">
                          {chapter.title || 'Capitolo senza titolo'}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-[10.5px] text-ink-faint">
                          <span>{wordsLabel(words)}</span>
                          {chapter.timelineLabel ? (
                            <span className="inline-flex min-w-0 items-center gap-0.5">
                              <Icon name="clock" size={10} />
                              <span className="truncate">{chapter.timelineLabel}</span>
                            </span>
                          ) : null}
                        </span>
                        {chapter.tags.length > 0 ? (
                          <span className="mt-1.5 flex flex-wrap gap-1">
                            {chapter.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center gap-1 text-[9.5px] font-medium text-ink-soft"
                                title={tag.name}
                              >
                                <span
                                  className="h-1 w-1 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                              </span>
                            ))}
                            {chapter.tags.length > 3 ? (
                              <span className="text-[9.5px] text-ink-faint">
                                +{chapter.tags.length - 3}
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </span>
                    </button>

                    <span
                      className={cx(
                        'flex shrink-0 flex-col gap-0.5 transition-opacity',
                        active
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                      )}
                    >
                      <IconButton
                        label="Sposta il capitolo su"
                        className="h-5 w-5"
                        disabled={index === 0}
                        onClick={() => moveChapter(index, -1)}
                      >
                        <Icon name="arrow-up" size={11} />
                      </IconButton>
                      <IconButton
                        label="Sposta il capitolo giù"
                        className="h-5 w-5"
                        disabled={index === story.chapters.length - 1}
                        onClick={() => moveChapter(index, 1)}
                      >
                        <Icon name="arrow-down" size={11} />
                      </IconButton>
                      <IconButton
                        label={`Elimina il capitolo ${chapter.title || index + 1}`}
                        className="h-5 w-5 hover:text-danger"
                        onClick={() => setDeleteTarget(chapter)}
                      >
                        <Icon name="trash" size={11} />
                      </IconButton>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-line p-2">
          <Button variant="secondary" className="w-full" onClick={addChapter}>
            <Icon name="plus" size={14} />
            Nuovo capitolo
          </Button>
        </div>
      </aside>

      {selected ? (
        <ChapterEditor
          key={selected.id}
          story={story}
          chapter={selected}
          index={selectedIndex}
          total={story.chapters.length}
          palette={palette}
          timelineLabels={timelineLabels}
          updateStory={updateStory}
        />
      ) : (
        <div className="card">
          <EmptyState
            icon="book"
            title="La pagina è ancora bianca"
            description="Crea il primo capitolo per dare inizio alla storia. Potrai aggiungere tag, momenti nella timeline e molto altro."
            action={
              <Button variant="primary" onClick={addChapter}>
                <Icon name="plus" size={15} />
                Aggiungi il primo capitolo
              </Button>
            }
          />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminare il capitolo?"
        description={
          <>
            Stai per eliminare{' '}
            <span className="font-medium text-ink">
              «{deleteTarget?.title || 'capitolo senza titolo'}»
            </span>
            . Il testo, i tag e il collegamento alla timeline verranno rimossi definitivamente.
          </>
        }
        confirmLabel="Elimina capitolo"
        onConfirm={deleteChapter}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface ChapterEditorProps {
  story: Story;
  chapter: Chapter;
  index: number;
  total: number;
  palette: Story['tags'];
  timelineLabels: string[];
  updateStory: (storyId: string, updater: (story: Story) => Story) => void;
}

function ChapterEditor({
  story,
  chapter,
  index,
  total,
  palette,
  timelineLabels,
  updateStory,
}: ChapterEditorProps) {
  const words = countWords(chapter.content);
  const characters = contentToPlainText(chapter.content).length;

  const patchChapter = (patch: Partial<Chapter>) => {
    updateStory(story.id, (current) => ({
      ...current,
      chapters: current.chapters.map((item) =>
        item.id === chapter.id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item,
      ),
    }));
  };

  const linkedEvent = story.timeline.find((event) => event.chapterId === chapter.id) ?? null;
  const totalMoments = story.timeline.length;
  const timelinePosition = linkedEvent
    ? story.timeline.findIndex((event) => event.id === linkedEvent.id) + 1
    : 0;

  const moveInTimeline = (position: number) => {
    if (!linkedEvent || totalMoments < 2) return;
    const from = story.timeline.findIndex((event) => event.id === linkedEvent.id);
    const to = Math.min(Math.max(position - 1, 0), totalMoments - 1);
    if (from < 0 || from === to) return;
    updateStory(story.id, (current) => {
      const timeline = [...current.timeline];
      const [moved] = timeline.splice(from, 1);
      timeline.splice(to, 0, moved);
      return { ...current, timeline };
    });
  };

  return (
    <section className="card p-5 sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label">
          Capitolo {String(index + 1).padStart(2, '0')} di {String(total).padStart(2, '0')}
        </p>
        <span className="text-[11.5px] text-ink-faint">{wordsLabel(words)}</span>
      </div>

      <input
        value={chapter.title}
        onChange={(event) => patchChapter({ title: event.target.value })}
        placeholder="Titolo del capitolo"
        aria-label="Titolo del capitolo"
        maxLength={140}
        className="mt-2 w-full border-0 bg-transparent font-serif text-[1.9rem] leading-tight tracking-tight text-ink outline-none placeholder:text-ink-faint sm:text-[2.15rem]"
      />

      <div className="mt-5 grid gap-5 rounded-xl border border-line bg-surface2 p-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <p className="label !mb-0">Tag del capitolo</p>
            <span className="text-[10px] normal-case tracking-normal text-ink-faint">
              (facoltativi)
            </span>
          </div>
          <TagEditor
            tags={chapter.tags}
            palette={palette}
            onChange={(tags) => patchChapter({ tags })}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="label !mb-0">Momento nella timeline</p>
            {chapter.timelineLabel ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
                <Icon name="check" size={10} strokeWidth={2.4} />
                Collegato
              </span>
            ) : null}
          </div>
          <MomentPicker
            value={chapter.timelineLabel}
            suggestions={timelineLabels}
            onChange={(value) => patchChapter({ timelineLabel: value })}
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
            Scegli un momento esistente o scrivine uno nuovo: apparirà subito nella timeline.
          </p>

          {chapter.timelineLabel && linkedEvent ? (
            <div className="mt-3 rounded-lg border border-line bg-surface px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-ink-soft">
                  Posizione nella timeline:{' '}
                  <span className="tabular-nums text-ink">
                    {timelinePosition} di {totalMoments}
                  </span>
                </p>
                <Icon name="clock" size={12} className="text-ink-faint" />
              </div>
              <input
                type="range"
                min={1}
                max={Math.max(1, totalMoments)}
                step={1}
                value={timelinePosition || 1}
                onChange={(event) => moveInTimeline(Number(event.target.value))}
                disabled={totalMoments < 2}
                aria-label="Posizione nella timeline"
                className="mt-2 h-1.5 w-full cursor-pointer accent-accent disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
                <span>Prima</span>
                <span>Dopo</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <RichTextEditor
          value={chapter.content}
          onChange={(content) => patchChapter({ content })}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-ink-faint">
        <span>
          {wordsLabel(words)} · {formatNumber(characters)}{' '}
          {characters === 1 ? 'carattere' : 'caratteri'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="save" size={12} />
          Salvataggio automatico
        </span>
      </div>
    </section>
  );
}

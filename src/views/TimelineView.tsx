import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type FocusEvent as ReactFocusEvent,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import type { Chapter, Story, TimelineEvent } from '../shared/types';
import { TIMELINE_COLORS, createTimelineEvent } from '../lib/factory';
import { cx, fullDate } from '../lib/utils';
import { Icon } from '../components/Icon';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Modal,
  Select,
  TagChip,
  TextArea,
  TextInput,
} from '../components/ui';

type ZoomLevel = 0 | 1 | 2;
type Orientation = 'horizontal' | 'vertical';

const ZOOM_LABELS = ['Dettagliato', 'Compatto', 'Panoramica'] as const;

interface TimelineViewProps {
  story: Story;
  updateStory: (storyId: string, updater: (story: Story) => Story) => void;
  onOpenChapter: (chapterId: string) => void;
}

interface HoverState {
  eventId: string;
  x: number;
  y: number;
  below: boolean;
}

export function TimelineView({ story, updateStory, onOpenChapter }: TimelineViewProps) {
  const [tagFilter, setTagFilter] = useState('all');
  const [chapterFilter, setChapterFilter] = useState('all');
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TimelineEvent | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(0);
  const [orientation, setOrientation] = useState<Orientation>(() => {
    try {
      return localStorage.getItem('scrittura-timeline-orientation') === 'vertical'
        ? 'vertical'
        : 'horizontal';
    } catch {
      return 'horizontal';
    }
  });
  const [dragEnabled, setDragEnabled] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    if (!hover) return;
    const hide = () => setHover(null);
    window.addEventListener('scroll', hide, true);
    return () => window.removeEventListener('scroll', hide, true);
  }, [hover]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  useEffect(() => {
    try {
      localStorage.setItem('scrittura-timeline-orientation', orientation);
    } catch {
      // Preference persistence is best-effort.
    }
  }, [orientation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      scrollRef.current.scrollTop = 0;
    }
    setHover(null);
  }, [orientation, zoomLevel]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const availableTags = useMemo(() => {
    const names = new Set<string>();
    for (const tag of story.tags) names.add(tag.name);
    for (const chapter of story.chapters) {
      for (const tag of chapter.tags) names.add(tag.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'it'));
  }, [story.tags, story.chapters]);

  const visibleEvents = story.timeline.filter((event) => {
    if (chapterFilter === 'standalone' && event.chapterId !== null) return false;
    if (
      chapterFilter !== 'all' &&
      chapterFilter !== 'standalone' &&
      event.chapterId !== chapterFilter
    ) {
      return false;
    }
    if (tagFilter !== 'all') {
      const chapter = story.chapters.find((item) => item.id === event.chapterId);
      if (!chapter || !chapter.tags.some((tag) => tag.name === tagFilter)) return false;
    }
    return true;
  });

  const filtersActive = tagFilter !== 'all' || chapterFilter !== 'all';
  const quickEditEvent = quickEditId
    ? (story.timeline.find((event) => event.id === quickEditId) ?? null)
    : null;
  const hoveredEvent = hover
    ? (story.timeline.find((event) => event.id === hover.eventId) ?? null)
    : null;
  const hoveredChapter = hoveredEvent?.chapterId
    ? (story.chapters.find((chapter) => chapter.id === hoveredEvent.chapterId) ?? null)
    : null;

  const patchEvent = (eventId: string, patch: Partial<TimelineEvent>) => {
    const event = story.timeline.find((item) => item.id === eventId);
    if (!event) return;
    const now = new Date().toISOString();
    updateStory(story.id, (current) => ({
      ...current,
      timeline: current.timeline.map((item) =>
        item.id === eventId ? { ...item, ...patch, updatedAt: now } : item,
      ),
      chapters:
        typeof patch.label === 'string' && event.chapterId
          ? current.chapters.map((chapter) =>
              chapter.id === event.chapterId
                ? { ...chapter, timelineLabel: patch.label as string, updatedAt: now }
                : chapter,
            )
          : current.chapters,
    }));
  };

  const moveEvent = (eventId: string, direction: -1 | 1) => {
    const from = story.timeline.findIndex((event) => event.id === eventId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= story.timeline.length) return;
    updateStory(story.id, (current) => {
      const timeline = [...current.timeline];
      const [moved] = timeline.splice(from, 1);
      timeline.splice(to, 0, moved);
      return { ...current, timeline };
    });
  };

  const reorderEvent = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const from = story.timeline.findIndex((event) => event.id === sourceId);
    const to = story.timeline.findIndex((event) => event.id === targetId);
    if (from < 0 || to < 0) return;
    updateStory(story.id, (current) => {
      const timeline = [...current.timeline];
      const [moved] = timeline.splice(from, 1);
      timeline.splice(to, 0, moved);
      return { ...current, timeline };
    });
  };

  const deleteEvent = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    updateStory(story.id, (current) => ({
      ...current,
      timeline: current.timeline.filter((event) => event.id !== target.id),
      chapters: target.chapterId
        ? current.chapters.map((chapter) =>
            chapter.id === target.chapterId ? { ...chapter, timelineLabel: '' } : chapter,
          )
        : current.chapters,
    }));
  };

  const addEvent = (input: { label: string; description: string; color: string }) => {
    const event = createTimelineEvent({
      label: input.label,
      description: input.description,
      color: input.color,
      chapterId: null,
    });
    updateStory(story.id, (current) => ({
      ...current,
      timeline: [...current.timeline, event],
    }));
    setNewEventOpen(false);
  };

  const beginDrag = (eventId: string) => {
    setDraggingId(eventId);
    setHover(null);
  };

  const endDrag = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const dropHandlers = (eventId: string) => ({
    onDragOver: (event: ReactDragEvent<HTMLDivElement>) => {
      if (!dragEnabled) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (dragOverId !== eventId) setDragOverId(eventId);
    },
    onDragLeave: (event: ReactDragEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setDragOverId(null);
      }
    },
    onDrop: (event: ReactDragEvent<HTMLDivElement>) => {
      if (!dragEnabled) return;
      event.preventDefault();
      const sourceId = event.dataTransfer.getData('text/plain') || draggingId;
      if (sourceId) reorderEvent(sourceId, eventId);
      endDrag();
    },
  });

  const openHover = (eventId: string, target: HTMLElement) => {
    if (zoomLevel === 0) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    const rect = target.getBoundingClientRect();
    const below = rect.top < 280;
    const x = Math.min(Math.max(rect.left + rect.width / 2, 158), window.innerWidth - 158);
    setHover({
      eventId,
      x,
      y: below ? rect.bottom + 10 : rect.top - 10,
      below,
    });
  };

  const scheduleHoverClose = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHover(null), 180);
  }, []);

  const cancelHoverClose = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  }, []);

  const hoverProps = (eventId: string) => ({
    onMouseEnter: (event: ReactMouseEvent<HTMLElement>) =>
      openHover(eventId, event.currentTarget),
    onMouseLeave: scheduleHoverClose,
    onFocus: (event: ReactFocusEvent<HTMLElement>) => openHover(eventId, event.currentTarget),
    onBlur: scheduleHoverClose,
  });

  const beginPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        'button, a, input, textarea, select, [contenteditable="true"], [draggable="true"]',
      )
    ) {
      return;
    }
    const container = scrollRef.current;
    if (!container) return;
    panRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
    setIsPanning(true);
    container.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panRef.current.active) return;
    const container = scrollRef.current;
    if (!container) return;
    container.scrollLeft = panRef.current.scrollLeft - (event.clientX - panRef.current.startX);
    container.scrollTop = panRef.current.scrollTop - (event.clientY - panRef.current.startY);
  };

  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panRef.current.active) return;
    panRef.current.active = false;
    setIsPanning(false);
    const container = scrollRef.current;
    if (container?.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
  };

  const deleteChapterTitle = deleteTarget?.chapterId
    ? story.chapters.find((chapter) => chapter.id === deleteTarget.chapterId)?.title
    : null;

  const changeZoom = (direction: -1 | 1) => {
    setZoomLevel((current) =>
      Math.min(2, Math.max(0, current + direction)) as ZoomLevel,
    );
  };

  const openQuickEdit = (eventId: string) => {
    setHover(null);
    setQuickEditId(eventId);
  };

  const renderDot = (event: TimelineEvent, extraClassName?: string) => (
    <button
      type="button"
      onClick={() => openQuickEdit(event.id)}
      {...hoverProps(event.id)}
      aria-label={`Apri il momento ${event.label}`}
      title={event.label}
      className={cx(
        'relative z-10 flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
        dragOverId === event.id && 'ring-2 ring-accent ring-offset-2 ring-offset-paper',
        extraClassName,
      )}
    >
      <span
        className={cx(
          'rounded-full border-[3px] border-paper shadow-card transition-transform duration-150 hover:scale-125',
          zoomLevel === 2 ? 'h-3.5 w-3.5' : 'h-4 w-4',
        )}
        style={{ backgroundColor: event.color }}
      />
    </button>
  );

  const renderCard = (
    event: TimelineEvent,
    index: number,
    chapter: Chapter | null,
    className?: string,
  ) => (
    <TimelineCard
      event={event}
      chapter={chapter}
      index={index}
      total={story.timeline.length}
      dragEnabled={dragEnabled}
      dragOver={dragOverId === event.id}
      className={className}
      onPatch={patchEvent}
      onMove={moveEvent}
      onEdit={openQuickEdit}
      onDelete={setDeleteTarget}
      onOpenChapter={onOpenChapter}
      onDragStart={beginDrag}
      onDragEnd={endDrag}
    />
  );

  const itemMinWidth = zoomLevel === 0 ? 330 : zoomLevel === 1 ? 180 : 88;
  const horizontalMinWidth = visibleEvents.length * itemMinWidth + 48;
  const lineTop = zoomLevel === 0 ? 64 : zoomLevel === 1 ? 106 : 74;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label">La sequenza della storia</p>
          <h2 className="mt-1.5 font-serif text-3xl leading-tight tracking-tight text-ink">
            Timeline
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Ogni capitolo con un momento assegnato si collega qui in automatico. Esplora la storia
            in orizzontale o in verticale, cambia lo zoom e riordina i momenti come preferisci.
          </p>
        </div>
        <Button variant="primary" onClick={() => setNewEventOpen(true)}>
          <Icon name="plus" size={15} />
          Nuovo evento
        </Button>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-ink-soft">
        <Icon name="sparkles" size={15} className="mt-0.5 shrink-0 text-accent" />
        <p>
          I momenti collegati ai capitoli si aggiornano da soli. Passa il puntatore sui punti per
          vedere i dettagli, fai clic per modificare, oppure usa lo zoom per leggere l'intero arco
          narrativo a colpo d'occhio.
        </p>
      </div>

      <div className="card mt-5 divide-y divide-line">
        <div className="flex flex-wrap items-end gap-3 px-4 py-3.5">
          <div className="min-w-[150px]">
            <p className="label mb-1.5">Filtra per tag</p>
            <Select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              aria-label="Filtra i momenti per tag"
              className="h-9 py-1 text-[13px]"
            >
              <option value="all">Tutti i tag</option>
              {availableTags.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[170px]">
            <p className="label mb-1.5">Filtra per capitolo</p>
            <Select
              value={chapterFilter}
              onChange={(event) => setChapterFilter(event.target.value)}
              aria-label="Filtra i momenti per capitolo"
              className="h-9 py-1 text-[13px]"
            >
              <option value="all">Tutti i capitoli</option>
              {story.chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.title || 'Capitolo senza titolo'}
                </option>
              ))}
              <option value="standalone">Solo eventi di ambientazione</option>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2 pb-0.5">
            <p className="text-[11.5px] text-ink-faint">
              {visibleEvents.length} di {story.timeline.length}{' '}
              {story.timeline.length === 1 ? 'momento' : 'momenti'}
            </p>
            {filtersActive ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTagFilter('all');
                  setChapterFilter('all');
                }}
              >
                Rimuovi filtri
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
            <IconButton
              label="Riduci lo zoom"
              onClick={() => changeZoom(1)}
              disabled={zoomLevel === 2}
              className="h-7 w-7"
            >
              <Icon name="minus" size={14} />
            </IconButton>
            <div className="min-w-[104px] px-1 text-center" aria-live="polite">
              <p className="text-[11.5px] font-semibold text-ink">{ZOOM_LABELS[zoomLevel]}</p>
              <p className="text-[9.5px] tabular-nums text-ink-faint">
                Zoom {3 - zoomLevel} di 3
              </p>
            </div>
            <IconButton
              label="Aumenta lo zoom"
              onClick={() => changeZoom(-1)}
              disabled={zoomLevel === 0}
              className="h-7 w-7"
            >
              <Icon name="plus" size={14} />
            </IconButton>
          </div>

          <div className="flex items-center gap-2">
            <span className="label !mb-0">Vista</span>
            <div
              className="inline-flex rounded-lg border border-line bg-surface p-0.5"
              role="group"
              aria-label="Orientamento della timeline"
            >
              {(['horizontal', 'vertical'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrientation(value)}
                  aria-pressed={orientation === value}
                  title={
                    value === 'horizontal'
                      ? 'Mostra la timeline in orizzontale'
                      : 'Mostra la timeline in verticale'
                  }
                  className={cx(
                    'rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
                    orientation === value
                      ? 'bg-accent-soft text-accent-ink'
                      : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {value === 'horizontal' ? 'Orizzontale' : 'Verticale'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={dragEnabled}
            onClick={() => {
              setDragEnabled((current) => !current);
              setDragOverId(null);
              setDraggingId(null);
            }}
            className="inline-flex items-center gap-2.5 rounded-lg px-1 py-1 text-left"
            title="Attiva o disattiva il riordino tramite trascinamento"
          >
            <span
              className={cx(
                'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                dragEnabled ? 'bg-accent' : 'bg-line',
              )}
              aria-hidden="true"
            >
              <span
                className={cx(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                  dragEnabled ? 'translate-x-[18px]' : 'translate-x-0.5',
                )}
              />
            </span>
            <span className="text-[12px] font-medium text-ink-soft">
              Attiva riordino drag &amp; drop
            </span>
          </button>

          <span className="ml-auto hidden text-[10.5px] text-ink-faint lg:block">
            Tasto destro per trascinare lo sfondo per spostarti nella timeline, tasto sinistro per fermarti. 
          </span>
        </div>
      </div>

      {story.timeline.length === 0 ? (
        <div className="card mt-5">
          <EmptyState
            icon="clock"
            title="La cronologia è ancora vuota"
            description="Assegna un «Momento nella timeline» a un capitolo, oppure aggiungi un evento di ambientazione per raccontare ciò che è accaduto prima della storia."
            action={
              <Button variant="primary" onClick={() => setNewEventOpen(true)}>
                <Icon name="plus" size={15} />
                Aggiungi un evento
              </Button>
            }
          />
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="card mt-5">
          <EmptyState
            icon="filter"
            title="Nessun momento con questi filtri"
            description="Prova a scegliere un altro tag o un altro capitolo. Gli eventi di ambientazione compaiono solo con il filtro «Tutti i tag»."
            action={
              <Button
                onClick={() => {
                  setTagFilter('all');
                  setChapterFilter('all');
                }}
              >
                Rimuovi i filtri
              </Button>
            }
          />
        </div>
      ) : (
        <div className="card mt-5 overflow-hidden">
          <div
            ref={scrollRef}
            data-timeline-list
            title={isPanning ? undefined : 'Trascina lo sfondo per spostarti nella timeline'}
            className={cx(
              'scrollbar-thin',
              orientation === 'horizontal'
                ? 'overflow-x-auto overflow-y-hidden'
                : 'max-h-[70vh] overflow-x-hidden overflow-y-auto overscroll-contain',
            )}
          >
            <div
              onPointerDown={beginPan}
              onPointerMove={movePan}
              onPointerUp={endPan}
              onPointerCancel={endPan}
              className={cx('min-h-full', isPanning ? 'cursor-grabbing select-none' : '')}
            >
              {orientation === 'horizontal' ? (
              <div
                className="relative px-6 pb-5"
                style={{ minWidth: `${horizontalMinWidth}px` }}
              >
                <div
                  className="absolute left-8 right-8 h-px bg-line"
                  style={{ top: `${lineTop}px` }}
                  aria-hidden="true"
                />
                <div className="flex min-w-full">
                  {visibleEvents.map((event, index) => {
                    const chapter = event.chapterId
                      ? (story.chapters.find((item) => item.id === event.chapterId) ?? null)
                      : null;
                    const fullIndex = story.timeline.findIndex((item) => item.id === event.id);
                    if (zoomLevel === 0) {
                      return (
                        <div
                          key={event.id}
                          data-timeline-event
                          data-chapter-id={event.chapterId ?? ''}
                          {...dropHandlers(event.id)}
                          className="relative flex flex-1 shrink-0 flex-col items-center px-2"
                          style={{ minWidth: `${itemMinWidth}px` }}
                        >
                          <div className="relative flex h-[84px] w-full justify-center">
                            <span className="absolute top-1 font-serif text-[11px] text-ink-faint">
                              {String(fullIndex + 1).padStart(2, '0')}
                            </span>
                            <div className="absolute top-[48px]">{renderDot(event)}</div>
                          </div>
                          {renderCard(event, fullIndex, chapter, 'w-full max-w-[352px]')}
                        </div>
                      );
                    }

                    if (zoomLevel === 1) {
                      const labelAbove = index % 2 === 0;
                      return (
                        <div
                          key={event.id}
                          data-timeline-event
                          data-chapter-id={event.chapterId ?? ''}
                          {...dropHandlers(event.id)}
                          className="relative flex flex-1 shrink-0 flex-col items-center px-1"
                          style={{ minWidth: `${itemMinWidth}px` }}
                        >
                          <div className="relative h-[210px] w-full">
                            <div
                              className={cx(
                                'absolute inset-x-0 flex justify-center',
                                labelAbove ? 'top-3' : 'top-[128px]',
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => openQuickEdit(event.id)}
                                {...hoverProps(event.id)}
                                title={chapter?.title || event.label || 'Momento senza titolo'}
                                className="line-clamp-2 max-w-[158px] text-center text-[11.5px] font-medium leading-snug text-ink-soft transition-colors hover:text-ink"
                              >
                                {chapter?.title || event.label || 'Momento senza titolo'}
                              </button>
                            </div>
                            <div className="absolute left-1/2 top-[90px] -translate-x-1/2">
                              {renderDot(event)}
                            </div>
                            {dragEnabled ? (
                              <DragHandle
                                eventId={event.id}
                                onDragStart={beginDrag}
                                onDragEnd={endDrag}
                                className="absolute left-[calc(50%+15px)] top-[92px]"
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={event.id}
                        data-timeline-event
                        data-chapter-id={event.chapterId ?? ''}
                        {...dropHandlers(event.id)}
                        className="relative flex flex-1 shrink-0 flex-col items-center px-1"
                        style={{ minWidth: `${itemMinWidth}px` }}
                      >
                        <div className="relative h-[146px] w-full">
                          <div className="absolute left-1/2 top-[58px] -translate-x-1/2">
                            {renderDot(event)}
                          </div>
                          {dragEnabled ? (
                            <DragHandle
                              eventId={event.id}
                              onDragStart={beginDrag}
                              onDragEnd={endDrag}
                              className="absolute left-1/2 top-[90px] -translate-x-1/2"
                            />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : zoomLevel === 0 ? (
              <div className="relative px-4 py-5">
                <div className="absolute bottom-8 left-[38px] top-8 w-px bg-line" aria-hidden="true" />
                {visibleEvents.map((event) => {
                  const chapter = event.chapterId
                    ? (story.chapters.find((item) => item.id === event.chapterId) ?? null)
                    : null;
                  const fullIndex = story.timeline.findIndex((item) => item.id === event.id);
                  return (
                    <div
                      key={event.id}
                      data-timeline-event
                      data-chapter-id={event.chapterId ?? ''}
                      {...dropHandlers(event.id)}
                      className="relative flex gap-3 py-2"
                    >
                      <div className="relative flex w-11 shrink-0 justify-center">
                        <div className="relative z-10 mt-4">{renderDot(event)}</div>
                        {dragEnabled ? (
                          <DragHandle
                            eventId={event.id}
                            onDragStart={beginDrag}
                            onDragEnd={endDrag}
                            className="absolute left-1/2 top-[52px] -translate-x-1/2"
                          />
                        ) : null}
                      </div>
                      {renderCard(event, fullIndex, chapter, 'min-w-0 flex-1 max-w-[760px]')}
                    </div>
                  );
                })}
              </div>
            ) : zoomLevel === 1 ? (
              <div className="relative mx-auto max-w-3xl px-10 py-5">
                <div
                  className="absolute bottom-6 left-1/2 top-6 w-px bg-line"
                  aria-hidden="true"
                />
                {visibleEvents.map((event, index) => {
                  const chapter = event.chapterId
                    ? (story.chapters.find((item) => item.id === event.chapterId) ?? null)
                    : null;
                  const labelLeft = index % 2 === 0;
                  return (
                    <div
                      key={event.id}
                      data-timeline-event
                      data-chapter-id={event.chapterId ?? ''}
                      {...dropHandlers(event.id)}
                      className={cx(
                        'relative flex min-h-[92px] items-center justify-center rounded-xl transition-colors',
                        dragOverId === event.id && 'bg-accent-soft',
                      )}
                    >
                      <div
                        className={cx(
                          'absolute w-[42%]',
                          labelLeft
                            ? 'right-[calc(50%+22px)] text-right'
                            : 'left-[calc(50%+22px)] text-left',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => openQuickEdit(event.id)}
                          {...hoverProps(event.id)}
                          title={chapter?.title || event.label || 'Momento senza titolo'}
                          className="line-clamp-2 text-[12px] font-medium leading-snug text-ink-soft transition-colors hover:text-ink"
                        >
                          {chapter?.title || event.label || 'Momento senza titolo'}
                        </button>
                      </div>
                      <div className="relative z-10">{renderDot(event)}</div>
                      {dragEnabled ? (
                        <DragHandle
                          eventId={event.id}
                          onDragStart={beginDrag}
                          onDragEnd={endDrag}
                          className="absolute left-1/2 top-[62%] -translate-x-1/2"
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relative mx-auto max-w-xs px-10 py-5">
                <div
                  className="absolute bottom-5 left-1/2 top-5 w-px bg-line"
                  aria-hidden="true"
                />
                {visibleEvents.map((event) => (
                  <div
                    key={event.id}
                    data-timeline-event
                    data-chapter-id={event.chapterId ?? ''}
                    {...dropHandlers(event.id)}
                    className={cx(
                      'relative flex min-h-[42px] items-center justify-center rounded-full transition-colors',
                      dragOverId === event.id && 'bg-accent-soft',
                    )}
                  >
                    {renderDot(event)}
                    {dragEnabled ? (
                      <DragHandle
                        eventId={event.id}
                        onDragStart={beginDrag}
                        onDragEnd={endDrag}
                        className="absolute left-[calc(50%+18px)] top-1/2 -translate-y-1/2"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {hover && hoveredEvent
        ? createPortal(
            <div
              className="fixed z-[60] w-72 -translate-x-1/2 animate-fade-in rounded-xl border border-line bg-surface p-3 shadow-float"
              style={{
                left: hover.x,
                top: hover.y,
                transform: hover.below ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
              }}
              onMouseEnter={cancelHoverClose}
              onMouseLeave={scheduleHoverClose}
              role="tooltip"
            >
              <p className="label">Momento nella timeline</p>
              <p className="mt-1 font-serif text-[15px] leading-snug text-ink">
                {hoveredEvent.label}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-soft">
                <Icon name="book" size={12} className="text-ink-faint" />
                <span className="truncate">
                  {hoveredChapter?.title || 'Evento di ambientazione'}
                </span>
              </p>
              {hoveredChapter && hoveredChapter.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {hoveredChapter.tags.map((tag) => (
                    <TagChip key={tag.id} tag={tag} />
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => openQuickEdit(hoveredEvent.id)}
                className="mt-2.5 inline-flex items-center gap-1.5 border-t border-line pt-2 text-[11px] font-medium text-accent-ink transition-colors hover:text-ink"
              >
                <Icon name="pencil" size={11} />
                Modifica il momento
              </button>
            </div>,
            document.body,
          )
        : null}

      <NewEventDialog
        open={newEventOpen}
        onClose={() => setNewEventOpen(false)}
        onAdd={addEvent}
      />

      {quickEditEvent ? (
        <QuickEditDialog
          key={quickEditEvent.id}
          open
          story={story}
          event={quickEditEvent}
          onClose={() => setQuickEditId(null)}
          onOpenChapter={(chapterId) => {
            setQuickEditId(null);
            onOpenChapter(chapterId);
          }}
          updateStory={updateStory}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminare il momento?"
        description={
          deleteTarget?.chapterId ? (
            <>
              Il momento verrà rimosso dalla cronologia. Il capitolo{' '}
              <span className="font-medium text-ink">
                «{deleteChapterTitle || 'senza titolo'}»
              </span>{' '}
              resterà intatto, ma perderà il suo riferimento temporale.
            </>
          ) : (
            "L'evento di ambientazione verrà rimosso dalla cronologia. L'operazione non può essere annullata."
          )
        }
        confirmLabel="Elimina momento"
        onConfirm={deleteEvent}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface TimelineCardProps {
  event: TimelineEvent;
  chapter: Chapter | null;
  index: number;
  total: number;
  dragEnabled: boolean;
  dragOver: boolean;
  className?: string;
  onPatch: (eventId: string, patch: Partial<TimelineEvent>) => void;
  onMove: (eventId: string, direction: -1 | 1) => void;
  onEdit: (eventId: string) => void;
  onDelete: (event: TimelineEvent) => void;
  onOpenChapter: (chapterId: string) => void;
  onDragStart: (eventId: string) => void;
  onDragEnd: () => void;
}

function TimelineCard({
  event,
  chapter,
  index,
  total,
  dragEnabled,
  dragOver,
  className,
  onPatch,
  onMove,
  onEdit,
  onDelete,
  onOpenChapter,
  onDragStart,
  onDragEnd,
}: TimelineCardProps) {
  return (
    <article
      className={cx(
        'card relative overflow-hidden p-4 transition-all duration-200',
        dragOver && 'ring-2 ring-accent',
        className,
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: event.color }}
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="font-serif text-[11px] tracking-wide text-ink-faint">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-0.5">
          {dragEnabled ? (
            <DragHandle eventId={event.id} onDragStart={onDragStart} onDragEnd={onDragEnd} />
          ) : null}
          <IconButton
            label="Modifica il momento"
            className="h-7 w-7"
            onClick={() => onEdit(event.id)}
          >
            <Icon name="pencil" size={12} />
          </IconButton>
          <IconButton
            label="Elimina il momento"
            className="h-7 w-7 hover:text-danger"
            onClick={() => onDelete(event)}
          >
            <Icon name="trash" size={12} />
          </IconButton>
        </div>
      </div>

      <MomentLabelInput
        value={event.label}
        linked={Boolean(event.chapterId)}
        onCommit={(label) => onPatch(event.id, { label })}
      />

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {chapter ? (
          <button
            type="button"
            onClick={() => onOpenChapter(chapter.id)}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-surface2 px-2 py-0.5 text-[11px] text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
            title="Vai al capitolo collegato"
          >
            <Icon name="book" size={11} />
            <span className="truncate">{chapter.title || 'Capitolo senza titolo'}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-2 py-0.5 text-[10.5px] text-ink-faint">
            <Icon name="sparkles" size={10} />
            Evento di ambientazione
          </span>
        )}
        {chapter?.tags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
      </div>

      <div className="mt-3">
        <label htmlFor={`event-description-${event.id}`} className="label mb-1.5">
          Sintesi dell'evento
        </label>
        <textarea
          id={`event-description-${event.id}`}
          value={event.description}
          onChange={(input) => onPatch(event.id, { description: input.target.value })}
          placeholder="Che cosa accade in questo momento?"
          rows={3}
          className="field-area resize-y text-[13px]"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {TIMELINE_COLORS.map((color, colorIndex) => (
          <button
            key={color}
            type="button"
            onClick={() => onPatch(event.id, { color })}
            aria-label={`Colore del momento ${colorIndex + 1}`}
            aria-pressed={event.color === color}
            title="Colore del momento"
            className={cx(
              'h-3.5 w-3.5 rounded-full border-2 transition-transform hover:scale-110',
              event.color === color ? 'border-ink' : 'border-transparent',
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
        <div className="flex items-center gap-0.5">
          <IconButton
            label="Sposta il momento prima"
            className="h-6 w-6"
            disabled={index === 0}
            onClick={() => onMove(event.id, -1)}
          >
            <Icon name="chevron-left" size={12} />
          </IconButton>
          <IconButton
            label="Sposta il momento dopo"
            className="h-6 w-6"
            disabled={index >= total - 1}
            onClick={() => onMove(event.id, 1)}
          >
            <Icon name="chevron-right" size={12} />
          </IconButton>
          <span className="ml-1 text-[9.5px] text-ink-faint" title={fullDate(event.updatedAt)}>
            {index + 1} di {total}
          </span>
        </div>
        {chapter ? (
          <button
            type="button"
            onClick={() => onOpenChapter(chapter.id)}
            className="inline-flex items-center gap-1 text-[10.5px] text-ink-faint transition-colors hover:text-ink"
          >
            Vai al capitolo
            <Icon name="external" size={10} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function DragHandle({
  eventId,
  onDragStart,
  onDragEnd,
  className,
}: {
  eventId: string;
  onDragStart: (eventId: string) => void;
  onDragEnd: () => void;
  className?: string;
}) {
  return (
    <div
      draggable
      role="button"
      tabIndex={0}
      title="Trascina per riordinare"
      aria-label="Trascina il momento per riordinarlo"
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.setData('text/plain', eventId);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(eventId);
      }}
      onDragEnd={onDragEnd}
      className={cx(
        'inline-flex h-6 w-6 cursor-grab items-center justify-center rounded-md border border-line bg-surface text-ink-faint shadow-card transition-colors hover:text-ink active:cursor-grabbing',
        className,
      )}
    >
      <Icon name="grip" size={13} />
    </div>
  );
}

function MomentLabelInput({
  value,
  linked,
  onCommit,
}: {
  value: string;
  linked: boolean;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  return (
    <input
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        if (!linked || next.trim() !== '') onCommit(next);
      }}
      onBlur={() => {
        setFocused(false);
        if (draft.trim() === '') {
          setDraft(value);
          return;
        }
        if (draft !== value) onCommit(draft);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      aria-label="Titolo del momento"
      placeholder="Titolo del momento"
      maxLength={160}
      className="mt-0.5 w-full border-0 bg-transparent font-serif text-lg leading-snug text-ink outline-none placeholder:text-ink-faint"
    />
  );
}

function QuickEditDialog({
  open,
  story,
  event,
  onClose,
  onOpenChapter,
  updateStory,
}: {
  open: boolean;
  story: Story;
  event: TimelineEvent;
  onClose: () => void;
  onOpenChapter: (chapterId: string) => void;
  updateStory: (storyId: string, updater: (story: Story) => Story) => void;
}) {
  const chapter = event.chapterId
    ? (story.chapters.find((item) => item.id === event.chapterId) ?? null)
    : null;
  const [label, setLabel] = useState(event.label);
  const [chapterTitle, setChapterTitle] = useState(chapter?.title ?? '');
  const [summary, setSummary] = useState(event.description);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLabel(event.label);
    setChapterTitle(chapter?.title ?? '');
    setSummary(event.description);
    setError('');
    // Reset only when the dialog opens for an event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event.id]);

  const handleSubmit = (formEvent: FormEvent) => {
    formEvent.preventDefault();
    if (!label.trim()) {
      setError('Inserisci un titolo per il momento.');
      return;
    }
    const now = new Date().toISOString();
    updateStory(story.id, (current) => ({
      ...current,
      timeline: current.timeline.map((item) =>
        item.id === event.id
          ? { ...item, label: label.trim(), description: summary, updatedAt: now }
          : item,
      ),
      chapters: chapter
        ? current.chapters.map((item) =>
            item.id === chapter.id
              ? {
                  ...item,
                  title: chapterTitle,
                  timelineLabel: label.trim(),
                  updatedAt: now,
                }
              : item,
          )
        : current.chapters,
    }));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifica il momento"
      description={
        chapter
          ? 'Aggiorna il momento, il titolo del capitolo collegato e la sintesi dell’evento.'
          : 'Aggiorna il titolo e la sintesi di questo evento di ambientazione.'
      }
      footer={
        <>
          {chapter ? (
            <Button
              variant="ghost"
              className="mr-auto"
              onClick={() => onOpenChapter(chapter.id)}
            >
              <Icon name="external" size={14} />
              Vai al capitolo
            </Button>
          ) : null}
          <Button onClick={onClose}>Annulla</Button>
          <Button variant="primary" type="submit" form="quick-edit-form">
            <Icon name="check" size={15} />
            Salva
          </Button>
        </>
      }
    >
      <form id="quick-edit-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {chapter ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface2 px-2 py-0.5 text-[11px] text-ink-soft">
              <Icon name="book" size={11} />
              {chapter.title || 'Capitolo senza titolo'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-2 py-0.5 text-[10.5px] text-ink-faint">
              <Icon name="sparkles" size={10} />
              Evento di ambientazione
            </span>
          )}
          {chapter?.tags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
        </div>

        <Field label="Momento nella timeline" htmlFor="quick-edit-label">
          <TextInput
            id="quick-edit-label"
            value={label}
            onChange={(input) => {
              setLabel(input.target.value);
              if (error) setError('');
            }}
            placeholder="Es. Notte della tempesta"
            maxLength={160}
            autoFocus
          />
          {error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : null}
        </Field>

        {chapter ? (
          <Field label="Titolo del capitolo collegato" htmlFor="quick-edit-chapter">
            <TextInput
              id="quick-edit-chapter"
              value={chapterTitle}
              onChange={(input) => setChapterTitle(input.target.value)}
              placeholder="Titolo del capitolo"
              maxLength={140}
            />
          </Field>
        ) : null}

        <Field label="Sintesi dell'evento" htmlFor="quick-edit-summary">
          <TextArea
            id="quick-edit-summary"
            value={summary}
            onChange={(input) => setSummary(input.target.value)}
            placeholder="Che cosa accade in questo momento?"
            rows={5}
            maxLength={1600}
          />
        </Field>
      </form>
    </Modal>
  );
}

interface NewEventDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: { label: string; description: string; color: string }) => void;
}

function NewEventDialog({ open, onClose, onAdd }: NewEventDialogProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(TIMELINE_COLORS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLabel('');
    setDescription('');
    setColor(TIMELINE_COLORS[0]);
    setError('');
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!label.trim()) {
      setError('Inserisci un titolo per il momento.');
      return;
    }
    onAdd({ label, description, color });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuovo evento di ambientazione"
      description="Racconta un fatto del mondo o del passato che non appartiene a un capitolo: un antefatto, una leggenda, una guerra lontana."
      footer={
        <>
          <Button onClick={onClose}>Annulla</Button>
          <Button variant="primary" type="submit" form="new-event-form">
            <Icon name="plus" size={15} />
            Aggiungi evento
          </Button>
        </>
      }
    >
      <form id="new-event-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Titolo del momento" htmlFor="new-event-label">
          <TextInput
            id="new-event-label"
            value={label}
            onChange={(event) => {
              setLabel(event.target.value);
              if (error) setError('');
            }}
            placeholder="Es. Autunno 1914 — La partenza"
            maxLength={140}
            autoFocus
          />
          {error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : null}
        </Field>

        <Field label="Descrizione" htmlFor="new-event-description">
          <TextArea
            id="new-event-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Che cosa accade e perché è importante per la storia?"
            rows={4}
            maxLength={1200}
          />
        </Field>

        <div>
          <p className="label mb-2">Colore del momento</p>
          <div className="flex flex-wrap gap-2">
            {TIMELINE_COLORS.map((value, index) => (
              <button
                key={value}
                type="button"
                onClick={() => setColor(value)}
                aria-label={`Colore del momento ${index + 1}`}
                aria-pressed={color === value}
                className={cx(
                  'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                  color === value ? 'border-ink' : 'border-transparent',
                )}
                style={{ backgroundColor: value }}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

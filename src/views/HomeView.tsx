import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Story, StoryStatus } from '../shared/types';
import { GENRE_SUGGESTIONS, STORY_STATUSES } from '../lib/factory';
import { useStories } from '../lib/store';
import {
  chaptersLabel,
  charactersLabel,
  countWords,
  cx,
  formatDate,
  formatNumber,
  fullDate,
  hexToRgba,
  wordsLabel,
} from '../lib/utils';
import { Icon } from '../components/Icon';
import {
  AppLogo,
  Button,
  BookCover,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Modal,
  SaveIndicator,
  Select,
  StatusBadge,
  TagChip,
  TextArea,
  TextInput,
  ThemeToggle,
} from '../components/ui';

interface HomeViewProps {
  onOpenStory: (storyId: string) => void;
}

interface ToastState {
  message: string;
  tone: 'success' | 'error';
}

export function HomeView({ onOpenStory }: HomeViewProps) {
  const {
    stories,
    createStory,
    duplicateStory,
    deleteStory,
    restoreSample,
    saveStatus,
    lastSavedAt,
  } = useStories();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StoryStatus>('all');
  const [newStoryOpen, setNewStoryOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const sorted = useMemo(
    () => [...stories].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [stories],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sorted.filter((story) => {
      if (statusFilter !== 'all' && story.status !== statusFilter) return false;
      if (!needle) return true;
      const tagNames = story.chapters.flatMap((chapter) => chapter.tags.map((tag) => tag.name));
      const haystack = [story.title, story.genre, story.synopsis, ...tagNames]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [sorted, query, statusFilter]);

  const totals = useMemo(() => {
    let words = 0;
    let chapters = 0;
    let characters = 0;
    for (const story of stories) {
      words += story.chapters.reduce((sum, chapter) => sum + countWords(chapter.content), 0);
      chapters += story.chapters.length;
      characters += story.characters.length;
    }
    return { words, chapters, characters };
  }, [stories]);

  const sampleExists = stories.some((story) => story.isSample);

  const notify = (message: string, tone: ToastState['tone'] = 'success') => {
    setToast({ message, tone });
  };

  const handleDuplicate = (story: Story) => {
    const copy = duplicateStory(story.id);
    if (copy) notify('Racconto duplicato nella tua biblioteca.');
    else notify('Non è stato possibile duplicare il racconto.', 'error');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteStory(target.id);
      notify('Racconto eliminato.');
    } catch {
      notify('Non è stato possibile eliminare il racconto.', 'error');
    }
  };

  const handleRestore = async () => {
    setRestoreOpen(false);
    try {
      await restoreSample();
      notify('Storia di esempio ripristinata.');
    } catch {
      notify('Non è stato possibile ripristinare la storia di esempio.', 'error');
    }
  };

  const openDataFolder = async () => {
    try {
      await window.scrittura.openDataFolder();
    } catch {
      notify('Non è stato possibile aprire la cartella dei dati.', 'error');
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3 sm:px-8">
          <AppLogo size={38} />
          <div className="mr-auto min-w-0">
            <p className="font-serif text-lg leading-none tracking-tight text-ink">Scrittura</p>
            <p className="mt-1 hidden text-[10px] uppercase tracking-[0.2em] text-ink-faint sm:block">
              Bottega di storie
            </p>
          </div>
          <div className="mr-1 hidden sm:block">
            <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
          </div>
          <ThemeToggle />
          <Button
            variant="primary"
            onClick={() => setNewStoryOpen(true)}
            className="shrink-0"
          >
            <Icon name="plus" size={15} />
            <span className="hidden sm:inline">Nuovo racconto</span>
            <span className="sm:hidden">Nuovo</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8">
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label">La tua biblioteca</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-ink sm:text-[2.75rem]">
              I miei racconti
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
              Storie, capitoli e personaggi sul tuo computer. Nessun account, nessun
              cloud, gratis per sempre.
            </p>
          </div>

          <div className="card flex items-stretch divide-x divide-line px-1 py-3">
            <div className="px-4">
              <p className="font-serif text-xl leading-none text-ink">{formatNumber(stories.length)}</p>
              <p className="mt-1 text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">
                {stories.length === 1 ? 'racconto' : 'racconti'}
              </p>
            </div>
            <div className="px-4">
              <p className="font-serif text-xl leading-none text-ink">{formatNumber(totals.chapters)}</p>
              <p className="mt-1 text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">
                capitoli
              </p>
            </div>
            <div className="px-4">
              <p className="font-serif text-xl leading-none text-ink">{formatNumber(totals.words)}</p>
              <p className="mt-1 text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">
                parole
              </p>
            </div>
            <div className="hidden px-4 sm:block">
              <p className="font-serif text-xl leading-none text-ink">
                {formatNumber(totals.characters)}
              </p>
              <p className="mt-1 text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">
                personaggi
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca per titolo o tag..."
              aria-label="Cerca per titolo o tag"
              className="field-input h-10 pl-9 pr-9"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                title="Cancella la ricerca"
                aria-label="Cancella la ricerca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-faint hover:text-ink"
              >
                <Icon name="x" size={13} />
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon
                name="filter"
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | StoryStatus)
                }
                aria-label="Filtra per stato"
                className="h-10 pl-8 sm:w-48"
              >
                <option value="all">Tutti gli stati</option>
                {STORY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
            {(query || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('all');
                }}
              >
                Azzera
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6">
          {stories.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="feather"
                title="La tua biblioteca è ancora vuota"
                description="Crea il tuo primo racconto oppure ripristina la storia di esempio per scoprire come funziona Scrittura."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="primary" onClick={() => setNewStoryOpen(true)}>
                      <Icon name="plus" size={15} />
                      Nuovo racconto
                    </Button>
                    <Button onClick={() => setRestoreOpen(true)}>
                      <Icon name="restore" size={15} />
                      Ripristina storia di esempio
                    </Button>
                  </div>
                }
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="search"
                title="Nessun racconto trovato"
                description="Prova a cambiare la ricerca o il filtro per stato: la storia che cerchi potrebbe essere da un'altra parte."
                action={
                  <Button
                    onClick={() => {
                      setQuery('');
                      setStatusFilter('all');
                    }}
                  >
                    Azzera i filtri
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onOpen={() => onOpenStory(story.id)}
                  onDuplicate={() => handleDuplicate(story)}
                  onDelete={() => setDeleteTarget(story)}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="mt-12 flex flex-col gap-3 border-t border-line pt-5 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5">
            <Icon name="save" size={13} />
            Tutto viene salvato automaticamente sul tuo computer.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setRestoreOpen(true)}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <Icon name="restore" size={13} />
              {sampleExists ? 'Ripristina la storia di esempio' : 'Ripristina storia di esempio'}
            </button>
            <button
              type="button"
              onClick={() => void openDataFolder()}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <Icon name="folder" size={13} />
              Apri cartella dei dati
            </button>
          </div>
        </footer>
      </main>

      <NewStoryDialog
        open={newStoryOpen}
        onClose={() => setNewStoryOpen(false)}
        onCreate={(input) => {
          const story = createStory(input);
          setNewStoryOpen(false);
          onOpenStory(story.id);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminare il racconto?"
        description={
          <>
            Stai per eliminare{' '}
            <span className="font-medium text-ink">«{deleteTarget?.title ?? ''}»</span>. Verranno
            rimossi tutti i capitoli, i personaggi e i momenti della timeline. L'operazione non può
            essere annullata.
          </>
        }
        confirmLabel="Elimina racconto"
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={restoreOpen}
        title="Ripristinare la storia di esempio?"
        description={
          sampleExists
            ? "La versione attuale della storia di esempio verrà sostituita dall'originale. Le altre storie non saranno toccate."
            : "Verrà aggiunto «L'Orologiaio di Vicolo San Marco», con quattro capitoli, tre schede personaggio e una timeline completa."
        }
        confirmLabel="Ripristina"
        cancelLabel="Annulla"
        tone="primary"
        onConfirm={() => void handleRestore()}
        onClose={() => setRestoreOpen(false)}
      />

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-40 flex max-w-sm animate-rise items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-float"
        >
          <span
            className={cx(
              'flex h-6 w-6 items-center justify-center rounded-full',
              toast.tone === 'success'
                ? 'bg-success text-paper'
                : 'bg-danger text-white',
            )}
          >
            <Icon name={toast.tone === 'success' ? 'check' : 'alert'} size={13} strokeWidth={2.2} />
          </span>
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}

function StoryCard({
  story,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  story: Story;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const words = story.chapters.reduce((sum, chapter) => sum + countWords(chapter.content), 0);
  const tags = useMemo(() => {
    const map = new Map<string, Story['tags'][number]>();
    for (const chapter of story.chapters) {
      for (const tag of chapter.tags) {
        if (!map.has(tag.id)) map.set(tag.id, tag);
      }
    }
    return Array.from(map.values());
  }, [story.chapters]);

  return (
    <article
      data-story-card
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Apri il racconto ${story.title}`}
      className="card group relative flex cursor-pointer flex-col overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ borderColor: hexToRgba(story.cardColor, 0.38) }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[4px]"
        style={{ backgroundColor: story.cardColor }}
        aria-hidden="true"
      />

      <div className="flex items-start gap-4">
        <div className="w-[94px] shrink-0">
          <div className="overflow-hidden rounded-lg shadow-card transition-transform duration-300 group-hover:-rotate-1 group-hover:scale-[1.02]">
            <BookCover
              cover={story.cover}
              title={story.title}
              color={story.cardColor}
              roundedClassName="rounded-lg"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="font-serif text-[1.3rem] leading-snug text-ink transition-colors group-hover:text-accent-ink">
            {story.title}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={story.status} />
            {story.genre ? (
              <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-soft">
                {story.genre}
              </span>
            ) : null}
            {story.isSample ? (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-medium text-accent-ink">
                Esempio
              </span>
            ) : null}
          </div>

          <p className="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-ink-soft">
            {story.synopsis || (
              <span className="italic text-ink-faint">
                Nessuna sinossi. Aggiungine una.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-h-[1.5rem] flex-wrap gap-1.5">
        {tags.slice(0, 3).map((tag) => (
          <TagChip key={tag.id} tag={tag} />
        ))}
        {tags.length > 3 ? (
          <span className="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-faint">
            +{tags.length - 3}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3.5 text-[11.5px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="book" size={13} />
          {chaptersLabel(story.chapters.length)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="users" size={13} />
          {charactersLabel(story.characters.length)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="feather" size={13} />
          {wordsLabel(words)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-ink-faint" title={fullDate(story.updatedAt)}>
          Ultima modifica: {formatDate(story.updatedAt)}
        </p>
        <div className="flex items-center gap-0.5">
          <IconButton
            label={`Duplica il racconto ${story.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onDuplicate();
            }}
            className="h-7 w-7"
          >
            <Icon name="copy" size={14} />
          </IconButton>
          <IconButton
            label={`Elimina il racconto ${story.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="h-7 w-7 hover:text-danger"
          >
            <Icon name="trash" size={14} />
          </IconButton>
          <span className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors group-hover:text-accent">
            <Icon name="chevron-right" size={16} />
          </span>
        </div>
      </div>
    </article>
  );
}

interface NewStoryDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    title: string;
    synopsis: string;
    genre: string;
    status: StoryStatus;
  }) => void;
}

function NewStoryDialog({ open, onClose, onCreate }: NewStoryDialogProps) {
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState<StoryStatus>('Bozza');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setSynopsis('');
    setGenre('');
    setStatus('Bozza');
    setError('');
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Inserisci un titolo per il racconto.');
      return;
    }
    onCreate({ title, synopsis, genre, status });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuovo racconto"
      description="Ogni racconto inizia da un titolo. Potrai aggiungere capitoli, personaggi e momenti in seguito."
      footer={
        <>
          <Button onClick={onClose}>Annulla</Button>
          <Button variant="primary" type="submit" form="new-story-form">
            <Icon name="plus" size={15} />
            Crea racconto
          </Button>
        </>
      }
    >
      <form id="new-story-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Titolo" htmlFor="new-story-title">
          <TextInput
            id="new-story-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError('');
            }}
            placeholder="Il titolo del tuo racconto"
            autoFocus
            maxLength={120}
          />
          {error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : null}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Genere" htmlFor="new-story-genre">
            <TextInput
              id="new-story-genre"
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              list="genre-suggestions"
              placeholder="Es. Mistero storico"
              maxLength={60}
            />
            <datalist id="genre-suggestions">
              {GENRE_SUGGESTIONS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </Field>
          <Field label="Stato" htmlFor="new-story-status">
            <Select
              id="new-story-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as StoryStatus)}
            >
              {STORY_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Sinossi"
          htmlFor="new-story-synopsis"
          hint="Due o tre frasi per ricordare di cosa parla la storia. Potrai modificarla quando vuoi."
        >
          <TextArea
            id="new-story-synopsis"
            value={synopsis}
            onChange={(event) => setSynopsis(event.target.value)}
            placeholder="Di cosa parla il tuo racconto?"
            rows={4}
            maxLength={800}
          />
        </Field>
      </form>
    </Modal>
  );
}

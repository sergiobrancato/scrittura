import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Story, StoryStatus, Tag } from '../shared/types';
import {
  DEFAULT_TAG_PALETTE,
  GENRE_SUGGESTIONS,
  STORY_CARD_COLORS,
  STORY_STATUSES,
} from '../lib/factory';
import { useStories } from '../lib/store';
import {
  chaptersLabel,
  countWords,
  cx,
  formatNumber,
  wordsLabel,
} from '../lib/utils';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import {
  AppLogo,
  BookCover,
  Button,
  Field,
  Modal,
  SaveIndicator,
  Select,
  StatusBadge,
  TextArea,
  TextInput,
  ThemeToggle,
} from '../components/ui';
import { ChaptersView } from './ChaptersView';
import { TimelineView } from './TimelineView';
import { CharactersView } from './CharactersView';

type Section = 'chapters' | 'timeline' | 'characters';

interface StoryWorkspaceProps {
  storyId: string;
  onBack: () => void;
}

export function StoryWorkspace({ storyId, onBack }: StoryWorkspaceProps) {
  const { stories, updateStory, saveStatus, lastSavedAt } = useStories();
  const story = stories.find((item) => item.id === storyId) ?? null;

  const [section, setSection] = useState<Section>('chapters');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    story?.chapters[0]?.id ?? null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [section]);

  useEffect(() => {
    if (!story) return;
    if (
      selectedChapterId &&
      !story.chapters.some((chapter) => chapter.id === selectedChapterId)
    ) {
      setSelectedChapterId(story.chapters[0]?.id ?? null);
    }
  }, [story, selectedChapterId]);

  const palette = useMemo<Tag[]>(() => {
    if (!story) return DEFAULT_TAG_PALETTE;
    const map = new Map<string, Tag>();
    for (const tag of [...DEFAULT_TAG_PALETTE, ...story.tags]) {
      const key = tag.name.toLowerCase();
      if (!map.has(key)) map.set(key, tag);
    }
    return Array.from(map.values());
  }, [story]);

  if (!story) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <AppLogo size={52} />
        <h1 className="mt-4 font-serif text-2xl text-ink">Racconto non trovato</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          Forse è stato eliminato o l'archivio locale è stato spostato. Torna alla biblioteca per
          scegliere un'altra storia.
        </p>
        <Button variant="primary" className="mt-5" onClick={onBack}>
          <Icon name="arrow-left" size={15} />
          Torna a I miei racconti
        </Button>
      </div>
    );
  }

  const totalWords = story.chapters.reduce((sum, chapter) => sum + countWords(chapter.content), 0);

  const openChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setSection('chapters');
  };

  const tabs: Array<{ id: Section; label: string; icon: IconName; count: number }> = [
    { id: 'chapters', label: 'Capitoli', icon: 'book', count: story.chapters.length },
    { id: 'timeline', label: 'Cronologia', icon: 'clock', count: story.timeline.length },
    {
      id: 'characters',
      label: 'Schede personaggio',
      icon: 'users',
      count: story.characters.length,
    },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-paper">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-5 py-2.5 sm:gap-3 sm:px-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface2 hover:text-ink"
            title="Torna alla biblioteca"
          >
            <Icon name="chevron-left" size={16} />
            <span className="hidden md:inline">I miei racconti</span>
          </button>
          <span className="hidden h-7 w-px bg-line sm:block" />
          <div className="hidden w-8 shrink-0 sm:block" title={`Copertina di ${story.title}`}>
            <BookCover
              cover={story.cover}
              title={story.title}
              color={story.cardColor}
              showTitle={false}
              roundedClassName="rounded-[4px]"
              className="shadow-card"
            />
          </div>
          <div className="mr-auto min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate font-serif text-[17px] leading-tight text-ink">
                {story.title}
              </h1>
              {story.isSample ? (
                <span className="hidden shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[9.5px] font-medium text-accent-ink sm:inline">
                  Esempio
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[10.5px] text-ink-faint">
              <StatusBadge status={story.status} />
              {story.genre ? <span className="truncate">{story.genre}</span> : null}
              <span className="hidden whitespace-nowrap sm:inline">
                {chaptersLabel(story.chapters.length)} · {wordsLabel(totalWords)}
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailsOpen(true)}
            title="Modifica titolo, sinossi e stato del racconto"
          >
            <Icon name="pencil" size={14} />
            <span className="hidden md:inline">Dettagli</span>
          </Button>
          <ThemeToggle />
        </div>

        <nav
          className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-4 sm:px-7"
          aria-label="Sezioni del racconto"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              aria-current={section === tab.id ? 'page' : undefined}
              className={cx('nav-tab shrink-0', section === tab.id && 'nav-tab-active')}
            >
              <Icon name={tab.icon} size={15} />
              {tab.label}
              <span
                className={cx(
                  'rounded-full px-1.5 py-0.5 text-[9.5px] tabular-nums',
                  section === tab.id
                    ? 'bg-accent-soft text-accent-ink'
                    : 'bg-surface2 text-ink-faint',
                )}
              >
                {formatNumber(tab.count)}
              </span>
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-7">
        {section === 'chapters' ? (
          <ChaptersView
            story={story}
            palette={palette}
            selectedChapterId={selectedChapterId}
            onSelectChapter={setSelectedChapterId}
            updateStory={updateStory}
          />
        ) : null}
        {section === 'timeline' ? (
          <TimelineView story={story} updateStory={updateStory} onOpenChapter={openChapter} />
        ) : null}
        {section === 'characters' ? (
          <CharactersView story={story} updateStory={updateStory} />
        ) : null}
      </main>

      <StoryDetailsDialog
        open={detailsOpen}
        story={story}
        onClose={() => setDetailsOpen(false)}
        onSave={(patch) => {
          updateStory(story.id, (current) => ({ ...current, ...patch }));
          setDetailsOpen(false);
        }}
      />
    </div>
  );
}

interface StoryDetailsDialogProps {
  open: boolean;
  story: Story;
  onClose: () => void;
  onSave: (patch: {
    title: string;
    synopsis: string;
    genre: string;
    status: StoryStatus;
    cover: string | null;
    cardColor: string;
  }) => void;
}

function StoryDetailsDialog({ open, story, onClose, onSave }: StoryDetailsDialogProps) {
  const [title, setTitle] = useState(story.title);
  const [synopsis, setSynopsis] = useState(story.synopsis);
  const [genre, setGenre] = useState(story.genre);
  const [status, setStatus] = useState<StoryStatus>(story.status);
  const [cover, setCover] = useState<string | null>(story.cover);
  const [cardColor, setCardColor] = useState(story.cardColor);
  const [error, setError] = useState('');
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(story.title);
    setSynopsis(story.synopsis);
    setGenre(story.genre);
    setStatus(story.status);
    setCover(story.cover);
    setCardColor(story.cardColor);
    setError('');
    setCoverError('');
  }, [open, story]);

  const uploadCover = async () => {
    setCoverBusy(true);
    setCoverError('');
    try {
      const result = await window.scrittura.importCover();
      if (result) setCover(result.url);
    } catch {
      setCoverError("Non è stato possibile importare la copertina. Riprova.");
    } finally {
      setCoverBusy(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Inserisci un titolo per il racconto.');
      return;
    }
    onSave({
      title: title.trim(),
      synopsis,
      genre,
      status,
      cover,
      cardColor,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dettagli del racconto"
      description="Personalizza la copertina e il colore della scheda, poi aggiorna titolo, sinossi e stato."
      widthClassName="max-w-2xl"
      footer={
        <>
          <Button onClick={onClose}>Annulla</Button>
          <Button variant="primary" type="submit" form="story-details-form">
            <Icon name="check" size={15} />
            Salva modifiche
          </Button>
        </>
      }
    >
      <form id="story-details-form" onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-xl border border-line bg-surface2 p-4">
          <p className="label mb-3">Copertina del libro</p>
          <div className="grid gap-4 sm:grid-cols-[124px_minmax(0,1fr)]">
            <div className="w-[118px]">
              <div className="overflow-hidden rounded-lg shadow-card">
                <BookCover
                  cover={cover}
                  title={title || story.title}
                  color={cardColor}
                  roundedClassName="rounded-lg"
                />
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void uploadCover()}
                  disabled={coverBusy}
                >
                  <Icon name="upload" size={14} />
                  {coverBusy
                    ? 'Apertura...'
                    : cover
                      ? 'Sostituisci copertina'
                      : 'Carica copertina'}
                </Button>
                {cover ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setCover(null)}
                  >
                    <Icon name="x" size={13} />
                    Rimuovi
                  </Button>
                ) : null}
              </div>
              <p className="text-[11px] leading-relaxed text-ink-faint">
                L'immagine viene copiata nell'archivio locale di Scrittura, così la copertina non si
                perderà mai.
              </p>
              {coverError ? (
                <p className="text-[11px] font-medium text-danger">{coverError}</p>
              ) : null}

              <div>
                <p className="label mb-2">Colore scheda racconto</p>
                <div className="flex flex-wrap gap-2">
                  {STORY_CARD_COLORS.map((option) => (
                    <button
                      key={option.color}
                      type="button"
                      onClick={() => setCardColor(option.color)}
                      title={option.name}
                      aria-label={`Colore ${option.name}`}
                      aria-pressed={cardColor.toLowerCase() === option.color.toLowerCase()}
                      className={cx(
                        'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                        cardColor.toLowerCase() === option.color.toLowerCase()
                          ? 'border-ink'
                          : 'border-transparent',
                      )}
                      style={{ backgroundColor: option.color }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                  <input
                    type="color"
                    value={cardColor}
                    onChange={(event) => setCardColor(event.target.value)}
                    aria-label="Colore personalizzato"
                    className="h-9 w-12 cursor-pointer rounded-md border border-line bg-surface p-0.5"
                  />
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wide text-ink-soft">
                      {cardColor}
                    </p>
                    <p className="text-[10.5px] text-ink-faint">Colore personalizzato</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Field label="Titolo" htmlFor="story-details-title">
          <TextInput
            id="story-details-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError('');
            }}
            maxLength={120}
          />
          {error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : null}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Genere" htmlFor="story-details-genre">
            <TextInput
              id="story-details-genre"
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              list="story-details-genres"
              maxLength={60}
              placeholder="Es. Mistero storico"
            />
            <datalist id="story-details-genres">
              {GENRE_SUGGESTIONS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </Field>
          <Field label="Stato" htmlFor="story-details-status">
            <Select
              id="story-details-status"
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
        <Field label="Sinossi" htmlFor="story-details-synopsis">
          <TextArea
            id="story-details-synopsis"
            value={synopsis}
            onChange={(event) => setSynopsis(event.target.value)}
            rows={5}
            maxLength={800}
            placeholder="Di cosa parla la storia?"
          />
        </Field>
      </form>
    </Modal>
  );
}

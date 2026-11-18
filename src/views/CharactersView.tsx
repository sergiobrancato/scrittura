import { useEffect, useState } from 'react';
import type { Character, Story } from '../shared/types';
import { ROLE_SUGGESTIONS, newCharacter } from '../lib/factory';
import { chaptersLabel, cx, initials } from '../lib/utils';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Portrait,
  TextArea,
  TextInput,
} from '../components/ui';

interface CharactersViewProps {
  story: Story;
  updateStory: (storyId: string, updater: (story: Story) => Story) => void;
}

export function CharactersView({ story, updateStory }: CharactersViewProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [openId]);

  const openCharacter = story.characters.find((character) => character.id === openId) ?? null;

  const patchCharacter = (characterId: string, patch: Partial<Character>) => {
    updateStory(story.id, (current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === characterId
          ? { ...character, ...patch, updatedAt: new Date().toISOString() }
          : character,
      ),
    }));
  };

  const addCharacter = () => {
    const character = newCharacter();
    updateStory(story.id, (current) => ({
      ...current,
      characters: [...current.characters, character],
    }));
    setOpenId(character.id);
  };

  const deleteCharacter = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    updateStory(story.id, (current) => ({
      ...current,
      characters: current.characters.filter((character) => character.id !== target.id),
    }));
    if (openId === target.id) setOpenId(null);
  };

  if (openCharacter) {
    return (
      <CharacterSheet
        story={story}
        character={openCharacter}
        onBack={() => setOpenId(null)}
        onDelete={() => setDeleteTarget(openCharacter)}
        onPatch={(patch) => patchCharacter(openCharacter.id, patch)}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label">I personaggi della storia</p>
          <h2 className="mt-1.5 font-serif text-3xl leading-tight tracking-tight text-ink">
            Schede personaggio
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Ritratti, dettagli fisici e moventi interiori: tutto ciò che serve per tenere i tuoi
            personaggi vivi sulla pagina.
          </p>
        </div>
        <Button variant="primary" onClick={addCharacter}>
          <Icon name="plus" size={15} />
          Nuovo personaggio
        </Button>
      </div>

      {story.characters.length === 0 ? (
        <div className="card mt-6">
          <EmptyState
            icon="users"
            title="Nessun personaggio, per ora"
            description="Una storia prende vita attraverso le persone che la abitano. Crea la prima scheda personaggio e comincia da un nome, un volto, un desiderio."
            action={
              <Button variant="primary" onClick={addCharacter}>
                <Icon name="plus" size={15} />
                Crea la prima scheda
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {story.characters.map((character) => {
            const linked = character.chapterIds.filter((chapterId) =>
              story.chapters.some((chapter) => chapter.id === chapterId),
            );
            return (
              <button
                key={character.id}
                type="button"
                onClick={() => setOpenId(character.id)}
                className="card group overflow-hidden p-0 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-faint hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Apri la scheda di ${character.name || 'un personaggio senza nome'}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-surface2">
                  <Portrait
                    src={character.portrait}
                    name={character.name}
                    roundedClassName="rounded-none"
                    className="h-full w-full transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent p-4 pt-12">
                    <p className="font-serif text-xl leading-tight text-white">
                      {character.name || 'Senza nome'}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-white/85">
                      {character.role || 'Ruolo da definire'}
                      {character.age ? ` · ${character.age}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint">
                    <Icon name="book" size={12} />
                    {linked.length}{' '}
                    {linked.length === 1 ? 'capitolo collegato' : 'capitoli collegati'}
                  </span>
                  <Icon
                    name="chevron-right"
                    size={15}
                    className="text-ink-faint transition-colors group-hover:text-accent"
                  />
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={addCharacter}
            className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface p-6 text-center transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface2 text-ink-faint">
              <Icon name="plus" size={22} />
            </span>
            <span className="mt-3 font-serif text-lg text-ink">Nuovo personaggio</span>
            <span className="mt-1.5 max-w-[200px] text-xs leading-relaxed text-ink-soft">
              Dai un volto e una voce a chi abita la tua storia.
            </span>
          </button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminare la scheda personaggio?"
        description={
          <>
            Stai per eliminare la scheda di{' '}
            <span className="font-medium text-ink">
              «{deleteTarget?.name || 'personaggio senza nome'}»
            </span>
            . Il ritratto e tutti i dettagli verranno rimossi. I capitoli non saranno modificati.
          </>
        }
        confirmLabel="Elimina scheda"
        onConfirm={deleteCharacter}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface CharacterSheetProps {
  story: Story;
  character: Character;
  onBack: () => void;
  onDelete: () => void;
  onPatch: (patch: Partial<Character>) => void;
}

function CharacterSheet({ story, character, onBack, onDelete, onPatch }: CharacterSheetProps) {
  const [portraitBusy, setPortraitBusy] = useState(false);
  const [portraitError, setPortraitError] = useState('');

  const uploadPortrait = async () => {
    setPortraitBusy(true);
    setPortraitError('');
    try {
      const result = await window.scrittura.importPortrait();
      if (result) onPatch({ portrait: result.url });
    } catch {
      setPortraitError("Non è stato possibile importare l'immagine. Riprova.");
    } finally {
      setPortraitBusy(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    const linked = character.chapterIds.includes(chapterId)
      ? character.chapterIds.filter((id) => id !== chapterId)
      : [...character.chapterIds, chapterId];
    onPatch({ chapterIds: linked });
  };

  const linkedCount = character.chapterIds.filter((chapterId) =>
    story.chapters.some((chapter) => chapter.id === chapterId),
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <Icon name="arrow-left" size={15} />
          Tutte le schede
        </button>
        <Button variant="danger-ghost" size="sm" onClick={onDelete}>
          <Icon name="trash" size={14} />
          Elimina personaggio
        </Button>
      </div>

      <div className="mt-4 flex items-start gap-4">
        <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface2 font-serif text-lg text-ink-soft sm:flex">
          {initials(character.name) || <Icon name="user" size={22} />}
        </div>
        <div className="min-w-0">
          <p className="label">Scheda personaggio</p>
          <h2 className="mt-1 font-serif text-3xl leading-tight tracking-tight text-ink">
            {character.name || 'Personaggio senza nome'}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {[character.role, character.age].filter(Boolean).join(' · ') ||
              'Ruolo ed età da definire'}
            {linkedCount > 0 ? ` · ${chaptersLabel(linkedCount)}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="card p-4 xl:sticky xl:top-[126px]">
          <p className="label mb-2">Foto / Ritratto</p>
          <Portrait
            src={character.portrait}
            name={character.name}
            className="aspect-[4/5] w-full"
            roundedClassName="rounded-xl"
          />
          <div className="mt-3 space-y-2">
            <Button
              className="w-full"
              onClick={() => void uploadPortrait()}
              disabled={portraitBusy}
            >
              <Icon name="upload" size={14} />
              {portraitBusy
                ? 'Apertura...'
                : character.portrait
                  ? 'Sostituisci ritratto'
                  : 'Carica ritratto'}
            </Button>
            {character.portrait ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onPatch({ portrait: null })}
              >
                <Icon name="x" size={13} />
                Rimuovi ritratto
              </Button>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
            L'immagine viene copiata nell'archivio locale di Scrittura, così il ritratto non si
            perderà mai.
          </p>
          {portraitError ? (
            <p className="mt-2 text-[11px] font-medium text-danger">{portraitError}</p>
          ) : null}
        </div>

        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <SheetSectionTitle icon="user" title="Informazioni generali" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nome" htmlFor="character-name" className="sm:col-span-2">
                <TextInput
                  id="character-name"
                  value={character.name}
                  onChange={(event) => onPatch({ name: event.target.value })}
                  placeholder="Come si chiama?"
                  maxLength={100}
                />
              </Field>
              <Field label="Ruolo" htmlFor="character-role">
                <TextInput
                  id="character-role"
                  value={character.role}
                  onChange={(event) => onPatch({ role: event.target.value })}
                  list={`role-suggestions-${character.id}`}
                  placeholder="Es. Protagonista"
                  maxLength={60}
                />
                <datalist id={`role-suggestions-${character.id}`}>
                  {ROLE_SUGGESTIONS.map((role) => (
                    <option key={role} value={role} />
                  ))}
                </datalist>
              </Field>
              <Field label="Età" htmlFor="character-age">
                <TextInput
                  id="character-age"
                  value={character.age}
                  onChange={(event) => onPatch({ age: event.target.value })}
                  placeholder="Es. 34 anni"
                  maxLength={40}
                />
              </Field>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <SheetSectionTitle icon="image" title="Dati fisici" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Altezza" htmlFor="character-height">
                <TextInput
                  id="character-height"
                  value={character.height}
                  onChange={(event) => onPatch({ height: event.target.value })}
                  placeholder="Es. 1,78 m"
                  maxLength={40}
                />
              </Field>
              <Field label="Corporatura" htmlFor="character-build">
                <TextInput
                  id="character-build"
                  value={character.build}
                  onChange={(event) => onPatch({ build: event.target.value })}
                  placeholder="Es. asciutta, slanciata"
                  maxLength={80}
                />
              </Field>
              <Field label="Colore occhi" htmlFor="character-eyes">
                <TextInput
                  id="character-eyes"
                  value={character.eyeColor}
                  onChange={(event) => onPatch({ eyeColor: event.target.value })}
                  placeholder="Es. verde oliva"
                  maxLength={60}
                />
              </Field>
              <Field label="Colore capelli" htmlFor="character-hair">
                <TextInput
                  id="character-hair"
                  value={character.hairColor}
                  onChange={(event) => onPatch({ hairColor: event.target.value })}
                  placeholder="Es. castano scuro"
                  maxLength={60}
                />
              </Field>
              <Field
                label="Segni particolari / Abbigliamento tipico"
                htmlFor="character-distinguishing"
                className="sm:col-span-2"
              >
                <TextArea
                  id="character-distinguishing"
                  value={character.distinguishingFeatures}
                  onChange={(event) => onPatch({ distinguishingFeatures: event.target.value })}
                  placeholder="Una cicatrice, un profumo, un cappotto che non toglie mai..."
                  rows={3}
                  maxLength={800}
                />
              </Field>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <SheetSectionTitle icon="feather" title="Tratti psicologici" />
            <div className="mt-4 grid gap-4">
              <Field label="Personalità" htmlFor="character-personality">
                <TextArea
                  id="character-personality"
                  value={character.personality}
                  onChange={(event) => onPatch({ personality: event.target.value })}
                  placeholder="Come si comporta? Quali sono le sue contraddizioni?"
                  rows={3}
                  maxLength={1200}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Obiettivi e desideri" htmlFor="character-goals">
                  <TextArea
                    id="character-goals"
                    value={character.goals}
                    onChange={(event) => onPatch({ goals: event.target.value })}
                    placeholder="Che cosa vuole davvero?"
                    rows={3}
                    maxLength={1200}
                  />
                </Field>
                <Field label="Paure e debolezze" htmlFor="character-fears">
                  <TextArea
                    id="character-fears"
                    value={character.fears}
                    onChange={(event) => onPatch({ fears: event.target.value })}
                    placeholder="Che cosa teme più di ogni altra cosa?"
                    rows={3}
                    maxLength={1200}
                  />
                </Field>
              </div>
              <Field label="Conflitto interiore" htmlFor="character-conflict">
                <TextArea
                  id="character-conflict"
                  value={character.innerConflict}
                  onChange={(event) => onPatch({ innerConflict: event.target.value })}
                  placeholder="La frattura che lo muove, il nodo che deve sciogliere..."
                  rows={3}
                  maxLength={1200}
                />
              </Field>
              <Field label="Note aggiuntive" htmlFor="character-notes">
                <TextArea
                  id="character-notes"
                  value={character.notes}
                  onChange={(event) => onPatch({ notes: event.target.value })}
                  placeholder="Tic, abitudini, oggetti simbolo, dettagli da ricordare."
                  rows={3}
                  maxLength={1200}
                />
              </Field>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <SheetSectionTitle
              icon="book"
              title="Capitoli collegati"
              description="Seleziona i capitoli in cui il personaggio compare o agisce."
            />
            {story.chapters.length === 0 ? (
              <p className="mt-4 text-sm text-ink-faint">
                Non ci sono ancora capitoli a cui collegare il personaggio.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {story.chapters.map((chapter, index) => {
                  const active = character.chapterIds.includes(chapter.id);
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => toggleChapter(chapter.id)}
                      aria-pressed={active}
                      className={cx(
                        'inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-[12px] transition-colors',
                        active
                          ? 'border-accent bg-accent-soft text-accent-ink'
                          : 'border-line bg-surface text-ink-soft hover:border-ink-faint hover:text-ink',
                      )}
                    >
                      <span
                        className={cx(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold',
                          active ? 'border-accent text-accent-ink' : 'border-line text-ink-faint',
                        )}
                      >
                        {active ? <Icon name="check" size={9} strokeWidth={2.6} /> : index + 1}
                      </span>
                      <span className="truncate">{chapter.title || 'Capitolo senza titolo'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SheetSectionTitle({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface2 text-ink-soft">
        <Icon name={icon} size={14} />
      </span>
      <div>
        <h3 className="font-serif text-lg leading-tight text-ink">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-ink-faint">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

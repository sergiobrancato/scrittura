import type { Chapter, Character, Story, StoryStatus, Tag, TimelineEvent } from '../shared/types';
import { uid } from './utils';

export const STORY_STATUSES: StoryStatus[] = ['Bozza', 'In corso', 'In revisione', 'Completato'];

export const DEFAULT_STORY_CARD_COLOR = '#a25634';

export const STORY_CARD_COLORS: Array<{ name: string; color: string }> = [
  { name: 'Terracotta', color: '#a25634' },
  { name: 'Salvia', color: '#6e8f86' },
  { name: 'Blu polvere', color: '#5f7fa3' },
  { name: 'Prugna', color: '#8d5a6d' },
  { name: 'Ambra', color: '#b27a3e' },
  { name: 'Lavanda', color: '#7c6ba0' },
  { name: 'Verde bosco', color: '#4f7a63' },
  { name: 'Ardesia', color: '#5c6b70' },
  { name: 'Borgogna', color: '#7a3f46' },
  { name: 'Sabbia', color: '#9a8a6a' },
];

export const GENRE_SUGGESTIONS = [
  'Mistero storico',
  'Romanzo storico',
  'Fantasy',
  'Fantascienza',
  'Thriller',
  'Romance',
  'Avventura',
  'Narrativa contemporanea',
  'Racconto breve',
];

export const ROLE_SUGGESTIONS = [
  'Protagonista',
  'Antagonista',
  'Co-protagonista',
  'Secondario',
  'Figura di supporto',
];

export const DEFAULT_TAG_PALETTE: Tag[] = [
  { id: 'tag-bozza', name: 'Bozza', color: '#9a8a6a' },
  { id: 'tag-da-rivedere', name: 'Da rivedere', color: '#b0674c' },
  { id: 'tag-colpo-di-scena', name: 'Colpo di scena', color: '#7c6ba0' },
  { id: 'tag-introduzione', name: 'Introduzione', color: '#6e8f86' },
  { id: 'tag-indagine', name: 'Indagine', color: '#5f7fa3' },
  { id: 'tag-svolta', name: 'Svolta', color: '#b27a3e' },
  { id: 'tag-finale', name: 'Finale', color: '#8d5a6d' },
];

export const TAG_COLORS = [
  '#6e8f86',
  '#5f7fa3',
  '#b27a3e',
  '#8d5a6d',
  '#7c6ba0',
  '#b0674c',
  '#9a8a6a',
  '#4f7a63',
  '#b05a41',
  '#5c6b70',
];

export const TAG_COLOR_NAMES = [
  'Salvia',
  'Azzurro polvere',
  'Ambra',
  'Prugna',
  'Lavanda',
  'Terracotta',
  'Sabbia',
  'Verde bosco',
  'Mattone',
  'Grigio ardesia',
];

export const TIMELINE_COLORS = [
  '#a25634',
  '#5f7fa3',
  '#6e8f86',
  '#b27a3e',
  '#8d5a6d',
  '#7c6ba0',
  '#5c6b70',
  '#9a8a6a',
];

export function newChapter(index: number): Chapter {
  const now = new Date().toISOString();
  return {
    id: uid('chapter'),
    title: `Capitolo ${index}`,
    content: '',
    tags: [],
    timelineLabel: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function createStory(input: {
  title: string;
  synopsis?: string;
  genre?: string;
  status?: StoryStatus;
}): Story {
  const now = new Date().toISOString();
  return {
    id: uid('story'),
    title: input.title.trim(),
    synopsis: input.synopsis?.trim() ?? '',
    genre: input.genre?.trim() ?? '',
    status: input.status ?? 'Bozza',
    cover: null,
    cardColor: DEFAULT_STORY_CARD_COLOR,
    chapters: [newChapter(1)],
    characters: [],
    timeline: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateStory(source: Story): Story {
  const now = new Date().toISOString();
  const chapterIdMap = new Map<string, string>();

  const chapters: Chapter[] = source.chapters.map((chapter) => {
    const id = uid('chapter');
    chapterIdMap.set(chapter.id, id);
    return {
      ...chapter,
      id,
      tags: chapter.tags.map((tag) => ({ ...tag })),
    };
  });

  const characters: Character[] = source.characters.map((character) => ({
    ...character,
    id: uid('character'),
    chapterIds: character.chapterIds
      .map((chapterId) => chapterIdMap.get(chapterId))
      .filter((chapterId): chapterId is string => Boolean(chapterId)),
  }));

  const timeline: TimelineEvent[] = source.timeline.map((event) => ({
    ...event,
    id: uid('event'),
    chapterId: event.chapterId ? (chapterIdMap.get(event.chapterId) ?? null) : null,
  }));

  return {
    ...source,
    id: uid('story'),
    title: `Copia di ${source.title}`,
    chapters,
    characters,
    timeline,
    tags: source.tags.map((tag) => ({ ...tag })),
    createdAt: now,
    updatedAt: now,
    isSample: false,
  };
}

export function newCharacter(): Character {
  const now = new Date().toISOString();
  return {
    id: uid('character'),
    name: '',
    role: 'Secondario',
    age: '',
    portrait: null,
    height: '',
    build: '',
    eyeColor: '',
    hairColor: '',
    distinguishingFeatures: '',
    personality: '',
    goals: '',
    fears: '',
    innerConflict: '',
    notes: '',
    chapterIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createTag(name: string, color: string): Tag {
  return { id: uid('tag'), name: name.trim(), color };
}

export function createTimelineEvent(input: {
  label: string;
  description?: string;
  color: string;
  chapterId?: string | null;
}): TimelineEvent {
  const now = new Date().toISOString();
  return {
    id: uid('event'),
    label: input.label.trim(),
    description: input.description?.trim() ?? '',
    color: input.color,
    chapterId: input.chapterId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

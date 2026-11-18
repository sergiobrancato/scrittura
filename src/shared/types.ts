export type StoryStatus = 'Bozza' | 'In corso' | 'In revisione' | 'Completato';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  tags: Tag[];
  timelineLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  description: string;
  color: string;
  chapterId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  age: string;
  portrait: string | null;
  height: string;
  build: string;
  eyeColor: string;
  hairColor: string;
  distinguishingFeatures: string;
  personality: string;
  goals: string;
  fears: string;
  innerConflict: string;
  notes: string;
  chapterIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  status: StoryStatus;
  cover: string | null;
  cardColor: string;
  chapters: Chapter[];
  characters: Character[];
  timeline: TimelineEvent[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

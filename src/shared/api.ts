import type { Story } from './types';

export interface PortraitImportResult {
  url: string;
  fileName: string;
}

export interface ScritturaApi {
  listStories(): Promise<Story[]>;
  saveStory(story: Story): Promise<void>;
  deleteStory(storyId: string): Promise<void>;
  restoreSample(): Promise<Story[]>;
  importPortrait(): Promise<PortraitImportResult | null>;
  importCover(): Promise<PortraitImportResult | null>;
  getDataPath(): Promise<string>;
  openDataFolder(): Promise<void>;
  onSaveRequest(callback: () => void): () => void;
  onBeforeClose(callback: () => void): () => void;
  confirmClose(): void;
}

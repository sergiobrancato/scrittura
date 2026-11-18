import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Story, StoryStatus } from '../shared/types';
import { createStory as buildStory, duplicateStory as cloneStory } from './factory';
import { normalizeStory } from './normalize';

export type SaveStatus = 'saved' | 'saving' | 'error';

export interface NewStoryInput {
  title: string;
  synopsis?: string;
  genre?: string;
  status?: StoryStatus;
}

interface StoriesContextValue {
  stories: Story[];
  ready: boolean;
  initError: string | null;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  createStory: (input: NewStoryInput) => Story;
  duplicateStory: (storyId: string) => Story | null;
  deleteStory: (storyId: string) => Promise<void>;
  restoreSample: () => Promise<void>;
  updateStory: (storyId: string, updater: (story: Story) => Story) => void;
  flush: () => Promise<void>;
}

const StoriesContext = createContext<StoriesContextValue | null>(null);

const SAVE_DELAY = 550;

export function StoriesProvider({ children }: { children: ReactNode }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const storiesRef = useRef<Story[]>([]);
  const savedRef = useRef<Map<string, Story>>(new Map());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const saveChainsRef = useRef<Map<string, Promise<void>>>(new Map());
  const deletedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    storiesRef.current = stories;
  }, [stories]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!window.scrittura) {
          throw new Error('Archivio locale non disponibile.');
        }
        const list = await window.scrittura.listStories();
        if (cancelled) return;
        const normalized = list.map(normalizeStory);
        savedRef.current = new Map(normalized.map((story) => [story.id, story]));
        setStories(normalized);
        setReady(true);
      } catch {
        if (!cancelled) {
          setInitError(
            "Impossibile leggere l'archivio locale. Chiudi e riapri Scrittura per riprovare.",
          );
          setReady(true);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const settleStatus = useCallback(() => {
    const dirty =
      timersRef.current.size > 0 ||
      storiesRef.current.some(
        (story) => savedRef.current.get(story.id) !== story && !deletedRef.current.has(story.id),
      );
    setSaveStatus(dirty ? 'saving' : 'saved');
  }, []);

  /** Serializes writes per story so an older save can never land after a newer one. */
  const enqueueSave = useCallback((story: Story): Promise<void> => {
    const previous = saveChainsRef.current.get(story.id) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(async () => {
        if (deletedRef.current.has(story.id)) return;
        await window.scrittura.saveStory(story);
        savedRef.current.set(story.id, story);
      });
    saveChainsRef.current.set(story.id, next);
    const cleanup = () => {
      if (saveChainsRef.current.get(story.id) === next) {
        saveChainsRef.current.delete(story.id);
      }
    };
    next.then(cleanup, cleanup);
    return next;
  }, []);

  const persist = useCallback(
    async (story: Story) => {
      if (deletedRef.current.has(story.id)) return;
      try {
        await enqueueSave(story);
        setLastSavedAt(new Date().toISOString());
        settleStatus();
      } catch (error) {
        console.error('Salvataggio non riuscito', error);
        setSaveStatus('error');
      }
    },
    [enqueueSave, settleStatus],
  );

  const scheduleSave = useCallback(
    (story: Story) => {
      setSaveStatus('saving');
      const existing = timersRef.current.get(story.id);
      if (existing) clearTimeout(existing);
      timersRef.current.set(
        story.id,
        setTimeout(() => {
          timersRef.current.delete(story.id);
          void persist(story);
        }, SAVE_DELAY),
      );
    },
    [persist],
  );

  useEffect(() => {
    if (!ready) return;
    for (const story of stories) {
      if (savedRef.current.get(story.id) === story) continue;
      scheduleSave(story);
    }
  }, [stories, ready, scheduleSave]);

  const flush = useCallback(async () => {
    const dirty = storiesRef.current.filter(
      (story) => savedRef.current.get(story.id) !== story && !deletedRef.current.has(story.id),
    );
    for (const timer of timersRef.current.values()) clearTimeout(timer);
    timersRef.current.clear();
    if (dirty.length === 0) {
      settleStatus();
      return;
    }

    setSaveStatus('saving');
    const results = await Promise.allSettled(dirty.map((story) => enqueueSave(story)));
    if (results.some((result) => result.status === 'rejected')) {
      setSaveStatus('error');
    } else {
      setLastSavedAt(new Date().toISOString());
      settleStatus();
    }
  }, [enqueueSave, settleStatus]);

  useEffect(() => {
    if (!window.scrittura?.onSaveRequest) return;
    return window.scrittura.onSaveRequest(() => {
      void flush();
    });
  }, [flush]);

  useEffect(() => {
    if (!window.scrittura?.onBeforeClose) return;
    return window.scrittura.onBeforeClose(() => {
      void flush().finally(() => window.scrittura.confirmClose());
    });
  }, [flush]);

  const createStory = useCallback((input: NewStoryInput): Story => {
    const story = buildStory(input);
    setStories((previous) => [story, ...previous]);
    return story;
  }, []);

  const duplicateStory = useCallback((storyId: string): Story | null => {
    const source = storiesRef.current.find((story) => story.id === storyId);
    if (!source) return null;
    const copy = normalizeStory(cloneStory(source));
    setStories((previous) => [copy, ...previous]);
    return copy;
  }, []);

  const deleteStory = useCallback(async (storyId: string): Promise<void> => {
    const timer = timersRef.current.get(storyId);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(storyId);
    deletedRef.current.add(storyId);
    try {
      const inFlight = saveChainsRef.current.get(storyId);
      if (inFlight) await inFlight.catch(() => undefined);
      await window.scrittura.deleteStory(storyId);
      savedRef.current.delete(storyId);
      saveChainsRef.current.delete(storyId);
      setStories((previous) => previous.filter((story) => story.id !== storyId));
    } catch (error) {
      deletedRef.current.delete(storyId);
      throw error;
    }
  }, []);

  const restoreSample = useCallback(async (): Promise<void> => {
    await flush();
    const list = await window.scrittura.restoreSample();
    for (const timer of timersRef.current.values()) clearTimeout(timer);
    timersRef.current.clear();
    deletedRef.current.clear();
    savedRef.current = new Map(list.map((story) => [story.id, story]));
    setStories(list);
    setSaveStatus('saved');
    setLastSavedAt(new Date().toISOString());
  }, [flush]);

  const updateStory = useCallback(
    (storyId: string, updater: (story: Story) => Story): void => {
      setStories((previous) =>
        previous.map((story) => {
          if (story.id !== storyId) return story;
          const updated = normalizeStory(updater(story));
          return { ...updated, updatedAt: new Date().toISOString() };
        }),
      );
    },
    [],
  );

  const value = useMemo<StoriesContextValue>(
    () => ({
      stories,
      ready,
      initError,
      saveStatus,
      lastSavedAt,
      createStory,
      duplicateStory,
      deleteStory,
      restoreSample,
      updateStory,
      flush,
    }),
    [
      stories,
      ready,
      initError,
      saveStatus,
      lastSavedAt,
      createStory,
      duplicateStory,
      deleteStory,
      restoreSample,
      updateStory,
      flush,
    ],
  );

  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>;
}

export function useStories(): StoriesContextValue {
  const context = useContext(StoriesContext);
  if (!context) throw new Error('useStories deve essere usato dentro StoriesProvider.');
  return context;
}

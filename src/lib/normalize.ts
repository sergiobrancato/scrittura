import type { Story, Tag } from '../shared/types';
import { SAMPLE_CARD_COLOR, SAMPLE_COVER_URL } from '../shared/sampleStory';
import { DEFAULT_STORY_CARD_COLOR, TIMELINE_COLORS } from './factory';

/**
 * Keeps chapters and timeline in sync:
 * - every chapter with a timeline label owns exactly one linked timeline event;
 * - editing a chapter label updates its event, clearing it removes the event;
 * - linked events for deleted chapters are pruned;
 * - the story tag palette accumulates every tag used in a chapter.
 */
export function normalizeStory(story: Story): Story {
  const linkedEvents = story.timeline.map((event) => ({ ...event }));
  const chapterIds = new Set(story.chapters.map((chapter) => chapter.id));

  const pruned = linkedEvents.filter(
    (event) => event.chapterId === null || chapterIds.has(event.chapterId),
  );

  for (const chapter of story.chapters) {
    const label = chapter.timelineLabel.trim();
    const existingIndex = pruned.findIndex((event) => event.chapterId === chapter.id);

    if (!label) {
      if (existingIndex >= 0) pruned.splice(existingIndex, 1);
      continue;
    }

    if (existingIndex >= 0) {
      pruned[existingIndex] = { ...pruned[existingIndex], label };
    } else {
      const now = new Date().toISOString();
      pruned.push({
        id: `event-${chapter.id}`,
        label,
        description: '',
        color: TIMELINE_COLORS[pruned.length % TIMELINE_COLORS.length],
        chapterId: chapter.id,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const tagMap = new Map<string, Tag>();
  for (const tag of story.tags) tagMap.set(tag.id, tag);
  for (const chapter of story.chapters) {
    for (const tag of chapter.tags) tagMap.set(tag.id, tag);
  }

  return {
    ...story,
    cover: story.cover ?? (story.isSample ? SAMPLE_COVER_URL : null),
    cardColor:
      story.cardColor ?? (story.isSample ? SAMPLE_CARD_COLOR : DEFAULT_STORY_CARD_COLOR),
    timeline: pruned,
    tags: Array.from(tagMap.values()),
  };
}

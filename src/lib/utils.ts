import type { StoryStatus } from '../shared/types';
import { contentToPlainText } from './richText';

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function uid(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

export function countWords(text: string): number {
  const trimmed = contentToPlainText(text).trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('it-IT').format(value);
}

export function wordsLabel(value: number): string {
  return `${formatNumber(value)} ${value === 1 ? 'parola' : 'parole'}`;
}

export function chaptersLabel(value: number): string {
  return `${formatNumber(value)} ${value === 1 ? 'capitolo' : 'capitoli'}`;
}

export function charactersLabel(value: number): string {
  return `${formatNumber(value)} ${value === 1 ? 'personaggio' : 'personaggi'}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const difference = Math.round((today.getTime() - day.getTime()) / 86_400_000);

  if (difference === 0) return `oggi alle ${formatTime(date)}`;
  if (difference === 1) return `ieri alle ${formatTime(date)}`;

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

export function fullDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function hexToRgba(hex: string, alpha: number): string {
  let value = hex.replace('#', '').trim();
  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return `rgba(162, 86, 52, ${alpha})`;
  }
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function readableOnColor(hex: string): string {
  let value = hex.replace('#', '').trim();
  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return '#f7f1e4';
  const red = parseInt(value.slice(0, 2), 16) / 255;
  const green = parseInt(value.slice(2, 4), 16) / 255;
  const blue = parseInt(value.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance > 0.55 ? '#241f19' : '#f8f2e6';
}

export function shadeHex(hex: string, amount: number): string {
  let value = hex.replace('#', '').trim();
  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return hex;
  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16);
    const target = amount < 0 ? 0 : 255;
    const mixed = Math.round(channel + (target - channel) * Math.abs(amount));
    return Math.max(0, Math.min(255, mixed))
      .toString(16)
      .padStart(2, '0');
  });
  return `#${channels.join('')}`;
}

export function statusDotColor(status: StoryStatus): string {
  switch (status) {
    case 'Completato':
      return '#5f7d5c';
    case 'In revisione':
      return '#b4843c';
    case 'In corso':
      return '#a25634';
    default:
      return '#998d7c';
  }
}

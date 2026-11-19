import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  protocol,
  session,
  shell,
} from 'electron';
import type { OpenDialogOptions } from 'electron';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { PortraitImportResult } from '../src/shared/api';
import type { Story } from '../src/shared/types';
import {
  createSampleStory,
  sampleCoverSvg,
  samplePortraitFiles,
  SAMPLE_CARD_COLOR,
  SAMPLE_COVER_FILE,
  SAMPLE_COVER_URL,
} from '../src/shared/sampleStory';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'scrittura',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

app.setName('Scrittura');

const isDev = process.argv.includes('--dev');

let mainWindow: BrowserWindow | null = null;
let closeAllowed = false;
let isQuitting = false;

const dataDir = (): string => path.join(app.getPath('userData'), 'scrittura-data');
const storiesDir = (): string => dataDir();
const portraitsDir = (): string => path.join(dataDir(), 'portraits');
const coversDir = (): string => path.join(dataDir(), 'covers');
const settingsPath = (): string => path.join(dataDir(), 'settings.json');
const storyFilePath = (storyId: string): string => {
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(storyId)) {
    throw new Error('Identificativo del racconto non valido.');
  }
  return path.join(storiesDir(), `${storyId}.json`);
};

interface Settings {
  seeded?: boolean;
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(portraitsDir(), { recursive: true });
  await fs.mkdir(coversDir(), { recursive: true });
}

async function readSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf8');
    const parsed = JSON.parse(raw) as Settings;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeSettings(settings: Settings): Promise<void> {
  await ensureDirs();
  await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2), 'utf8');
}

function isStory(value: unknown): value is Story {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Story>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.chapters) &&
    Array.isArray(candidate.characters) &&
    Array.isArray(candidate.timeline)
  );
}

async function readAllStories(): Promise<Story[]> {
  await ensureDirs();
  let entries: string[] = [];
  try {
    entries = await fs.readdir(storiesDir());
  } catch {
    return [];
  }

  const stories: Story[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json') || entry === 'settings.json') continue;
    if (entry.endsWith('.tmp')) continue;
    try {
      const raw = await fs.readFile(path.join(storiesDir(), entry), 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (isStory(parsed)) stories.push(parsed);
    } catch {
      // A damaged file must never block the rest of the library.
    }
  }

  return stories.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

async function writeStoryFile(story: Story): Promise<void> {
  await ensureDirs();
  const target = storyFilePath(story.id);
  const temp = `${target}.tmp`;
  await fs.writeFile(temp, JSON.stringify(story, null, 2), 'utf8');
  await fs.rename(temp, target);
}

async function saveSampleAssets(): Promise<void> {
  await ensureDirs();
  for (const portrait of samplePortraitFiles) {
    await fs.writeFile(path.join(portraitsDir(), portrait.fileName), portrait.svg, 'utf8');
  }
  await fs.writeFile(path.join(coversDir(), SAMPLE_COVER_FILE), sampleCoverSvg, 'utf8');
}

async function ensureSampleCoverFile(): Promise<void> {
  await ensureDirs();
  const target = path.join(coversDir(), SAMPLE_COVER_FILE);
  try {
    await fs.access(target);
  } catch {
    await fs.writeFile(target, sampleCoverSvg, 'utf8');
  }
}

async function seedSampleStory(): Promise<Story> {
  const story = createSampleStory();
  await writeStoryFile(story);
  await saveSampleAssets();
  await writeSettings({ seeded: true });
  return story;
}

/** Adds the illustrated cover to sample stories saved by earlier versions. */
async function migrateSampleStory(stories: Story[]): Promise<Story[]> {
  await ensureSampleCoverFile();
  for (const story of stories) {
    if (!story.isSample) continue;
    let changed = false;
    if (!story.cover) {
      story.cover = SAMPLE_COVER_URL;
      changed = true;
    }
    if (!story.cardColor) {
      story.cardColor = SAMPLE_CARD_COLOR;
      changed = true;
    }
    if (changed) await writeStoryFile(story);
  }
  return stories;
}

async function ensureSeeded(): Promise<void> {
  const settings = await readSettings();
  const stories = await readAllStories();
  if (stories.length === 0) {
    if (!settings.seeded) {
      await seedSampleStory();
    }
    return;
  }
  if (!settings.seeded) {
    await writeSettings({ ...settings, seeded: true });
  }
}

async function listStories(): Promise<Story[]> {
  await ensureSeeded();
  return migrateSampleStory(await readAllStories());
}

async function restoreSample(): Promise<Story[]> {
  await ensureDirs();
  const current = await readAllStories();
  for (const story of current) {
    if (story.isSample) {
      try {
        await fs.unlink(storyFilePath(story.id));
      } catch {
        // The sample may already have been removed from disk.
      }
    }
  }
  await seedSampleStory();
  return readAllStories();
}

async function importImage(kind: 'portrait' | 'cover'): Promise<PortraitImportResult | null> {
  const isCover = kind === 'cover';
  const options: OpenDialogOptions = {
    title: isCover ? 'Scegli la copertina del libro' : 'Scegli il ritratto del personaggio',
    buttonLabel: isCover ? 'Usa questa copertina' : 'Usa questa immagine',
    properties: ['openFile'],
    filters: [
      { name: 'Immagini', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'] },
    ],
  };

  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, options)
    : await dialog.showOpenDialog(options);

  if (result.canceled || result.filePaths.length === 0) return null;

  const source = result.filePaths[0];
  const extension = path.extname(source).toLowerCase();
  const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp']);
  if (!allowed.has(extension)) {
    throw new Error("Il formato dell'immagine non è supportato.");
  }

  const stats = await fs.stat(source);
  if (stats.size > 25 * 1024 * 1024) {
    throw new Error("L'immagine supera il limite di 25 MB.");
  }

  await ensureDirs();
  const base = path
    .basename(source, extension)
    .normalize('NFKD')
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const fileName = `${Date.now()}-${base || (isCover ? 'copertina' : 'ritratto')}${extension}`;
  const targetDir = isCover ? coversDir() : portraitsDir();
  await fs.copyFile(source, path.join(targetDir, fileName));

  return {
    url: `scrittura://${kind}/${encodeURIComponent(fileName)}`,
    fileName,
  };
}

async function importPortrait(): Promise<PortraitImportResult | null> {
  return importImage('portrait');
}

async function importCover(): Promise<PortraitImportResult | null> {
  return importImage('cover');
}

function mimeForFile(fileName: string): string {
  switch (path.extname(fileName).toLowerCase()) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.bmp':
      return 'image/bmp';
    default:
      return 'application/octet-stream';
  }
}

function registerProtocol(): void {
  protocol.handle('scrittura', async (request) => {
    try {
      const url = new URL(request.url);
      const folder =
        url.host === 'portrait'
          ? portraitsDir()
          : url.host === 'cover'
            ? coversDir()
            : null;
      if (!folder) {
        return new Response('Risorsa non trovata.', { status: 404 });
      }
      const rawName = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const fileName = path.basename(rawName);
      const filePath = path.join(folder, fileName);
      const data = await fs.readFile(filePath);
      return new Response(new Uint8Array(data), {
        status: 200,
        headers: {
          'content-type': mimeForFile(fileName),
          'cache-control': 'no-cache',
        },
      });
    } catch {
      return new Response('Risorsa non trovata.', { status: 404 });
    }
  });
}

function registerIpc(): void {
  ipcMain.handle('stories:list', async () => listStories());

  ipcMain.handle('stories:save', async (_event, story: Story) => {
    if (!isStory(story)) throw new Error('Dati del racconto non validi.');
    await writeStoryFile(story);
    await writeSettings({ ...(await readSettings()), seeded: true });
  });

  ipcMain.handle('stories:delete', async (_event, storyId: string) => {
    if (typeof storyId !== 'string') throw new Error('Identificativo non valido.');
    try {
      await fs.unlink(storyFilePath(storyId));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') throw error;
    }
  });

  ipcMain.handle('stories:restore-sample', async () => restoreSample());
  ipcMain.handle('portraits:import', async () => importPortrait());
  ipcMain.handle('covers:import', async () => importCover());
  ipcMain.handle('app:data-path', async () => dataDir());
  ipcMain.handle('app:open-data-folder', async () => {
    await ensureDirs();
    const error = await shell.openPath(dataDir());
    if (error) throw new Error(error);
  });

  ipcMain.on('app:close-ready', () => {
    const win = mainWindow;
    if (!win || win.isDestroyed()) return;
    closeAllowed = true;
    if (isQuitting) app.quit();
    else win.close();
  });
}

function createWindow(): BrowserWindow {
  closeAllowed = false;
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(app.getAppPath(), 'build', 'icon.png');

  const win = new BrowserWindow({
    width: 1420,
    height: 920,
    minWidth: 1000,
    minHeight: 680,
    title: 'Scrittura — Bottega di storie',
    backgroundColor: '#14161a',
    icon: iconPath,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true,
    },
  });

  mainWindow = win;
  Menu.setApplicationMenu(null);

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev && url.startsWith('http://localhost:5173');
    if (!allowed) event.preventDefault();
  });

  win.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    if ((input.control || input.meta) && key === 's') {
      event.preventDefault();
      win.webContents.send('app:request-save');
    }
    if (key === 'f12' && isDev) {
      win.webContents.toggleDevTools();
    }
  });

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  win.on('close', (event) => {
    if (closeAllowed) return;
    event.preventDefault();
    win.webContents.send('app:before-close');
    setTimeout(() => {
      if (!win.isDestroyed()) {
        closeAllowed = true;
        if (isQuitting) app.quit();
        else win.close();
      }
    }, 3000);
  });

  if (isDev) {
    void win.loadURL('http://localhost:5173');
  } else {
    void win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  return win;
}

async function bootstrap(): Promise<void> {
  const lock = app.requestSingleInstanceLock();
  if (!lock) {
    app.quit();
    return;
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  await app.whenReady();
  registerProtocol();
  registerIpc();
  await ensureDirs();

  try {
    session.defaultSession.setSpellCheckerLanguages(['it-IT']);
  } catch {
    // Spellchecking in Italian depends on the operating system dictionaries.
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
});

void bootstrap();

import { contextBridge, ipcRenderer } from 'electron';
import type { ScritturaApi } from '../src/shared/api';

const api: ScritturaApi = {
  listStories: () => ipcRenderer.invoke('stories:list'),
  saveStory: (story) => ipcRenderer.invoke('stories:save', story),
  deleteStory: (storyId) => ipcRenderer.invoke('stories:delete', storyId),
  restoreSample: () => ipcRenderer.invoke('stories:restore-sample'),
  importPortrait: () => ipcRenderer.invoke('portraits:import'),
  importCover: () => ipcRenderer.invoke('covers:import'),
  getDataPath: () => ipcRenderer.invoke('app:data-path'),
  openDataFolder: () => ipcRenderer.invoke('app:open-data-folder'),
  onSaveRequest: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('app:request-save', listener);
    return () => {
      ipcRenderer.removeListener('app:request-save', listener);
    };
  },
  onBeforeClose: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('app:before-close', listener);
    return () => {
      ipcRenderer.removeListener('app:before-close', listener);
    };
  },
  confirmClose: () => {
    ipcRenderer.send('app:close-ready');
  },
};

contextBridge.exposeInMainWorld('scrittura', api);

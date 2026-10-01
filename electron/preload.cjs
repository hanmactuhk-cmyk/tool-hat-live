const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  getVersion: () => process.versions.electron,
  openSoundSettings: () => ipcRenderer.invoke('open-sound-settings'),
  checkVirtualDriver: () => ipcRenderer.invoke('check-virtual-driver'),
});

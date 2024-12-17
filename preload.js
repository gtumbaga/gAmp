const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getDroppedFiles: () => ipcRenderer.invoke('get-dropped-files'),
});
// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const mm = require('music-metadata');
const commonWindowWidth = 450;
const path = require('path');

let mainWindow;
let playlistWindow = null;
let isPlaylistWindowOpen = false;

ipcMain.handle('choose-file', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Audio Files', extensions: ['mp3', 'aac', 'm4a'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        return filePath;
    }
    return null;
});

// Add this handler after your existing ipcMain.handle('choose-file') handler
ipcMain.handle('get-audio-metadata', async (event, filePath) => {
    try {
        const metadata = await mm.parseFile(filePath);
        // parse file name
        const fileName = path.basename(filePath);
        metadata.fileName = fileName;
        // console.log(metadata);
        return metadata;
    } catch (error) {
        console.error('Error reading metadata:', error);
        return null;
    }
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: commonWindowWidth,
        height: 200,
        resizable: false,
        minimizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        titleBarStyle: 'hidden',
        // backgroundColor: '#2f3241',
        frame: false,
        titleBarOverlay: {
            height: 30,
        },
        hiddenInMissionControl: false,
        trafficLightPosition: { x: -100, y: -100 },
    });

    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    ipcMain.on('toggle-playlist-window', (event) => {
        if (playlistWindow === null) {
            const mainWindowBounds = mainWindow.getBounds();
            playlistWindow = new BrowserWindow({
                width: commonWindowWidth,
                height: 400,
                x: mainWindowBounds.x,  // Same x position as main window
                y: mainWindowBounds.y + mainWindowBounds.height, // Below main window
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });

            playlistWindow.loadFile('playlist.html');
            isPlaylistWindowOpen = true;
            event.reply('playlist-window-status', true);

            playlistWindow.on('closed', () => {
                playlistWindow = null;
                isPlaylistWindowOpen = false;
                if (mainWindow) {
                    mainWindow.webContents.send('playlist-window-status', false);
                }
            });
        } else {
            playlistWindow.close();
            isPlaylistWindowOpen = false;
            event.reply('playlist-window-status', false);
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

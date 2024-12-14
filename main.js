// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const commonWindowWidth = 450;


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
        return result.filePaths[0];
    }
    return null;
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

// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const commonWindowWidth = 450;

let mainWindow;
let playlistWindow = null;

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

    ipcMain.on('open-playlist-window', () => {
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

            playlistWindow.on('closed', () => {
                playlistWindow = null;
            });
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

function createPlaylistWindow() {
    playlistWindow = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    playlistWindow.loadFile('playlist.html');
    playlistWindow.on('closed', () => {
        playlistWindow = null;
    });
}
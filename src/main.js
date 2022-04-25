const { app, dialog, ipcMain, BrowserWindow } = require('electron');
const path = require('path');

// Bandera que indica si el sistema esta en desarrollo
// process.env.NODE_ENV !== 'production';
const isInDev = false;

if (isInDev) {
    try {
        require('electron-reloader')(module, {
            debug: true,
            watchRenderer: true
        });
    } catch (_) { console.log('Error'); }  
}

let mainWindow;
    
ipcMain.on('system:download', (event, arg) => {
    dialog.showSaveDialog(mainWindow, {
        title: 'Save audio file',
        filters: [
            { name: 'Audio', extensions: ['wav'] }
        ]
    }).then(result => {
        console.log(result);
        mainWindow.webContents.send('system:path_save', {
            filePath: result.filePath,
            canceled: result.canceled,
            voice: arg.voice,
            rate: arg.rate,
            tts: arg.tts,
            message: false
        });
    }).catch(err => {
        mainWindow.webContents.send('system:path_save', {
            filePath: '',
            canceled: true,
            message: true
        });
    });
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        title: 'UnU TTS',
        minHeight: 300,
        minWidth: 300,
        height: 615,
        width: 600,
        show: false,
        center: true,
        webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true,
            devTools: isInDev
        },
        autoHideMenuBar: true,
        icon: '../public/ics/icon.ico'
    });
    mainWindow.setIcon(path.join(__dirname, '../public/ics/icon.ico'));
    mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
    // Si esta en desarrollo, mostrar herramientas de tal modo
    if (isInDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.setMenu(null);
    }
    mainWindow.on('closed', () => {
        app.quit();
    });
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    frame: false,
    transparent: false,
    resizable: true,
    center: true,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#070707',
    hasShadow: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // Windows 11 native acrylic (optional)
  if (process.platform === 'win32') {
    try { mainWindow.setBackgroundMaterial('none'); } catch (e) {}
  }

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

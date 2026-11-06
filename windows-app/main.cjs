const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');
const URL_ = 'https://tamken1.lovable.app/';
app.setName('Tamken Admin');
function create() {
  const win = new BrowserWindow({
    width: 1280, height: 820, backgroundColor: '#1b2230', title: 'تمكين - الإدارة',
    icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, partition: 'persist:tamken' }
  });
  win.loadURL(URL_).catch(() => {});
  win.webContents.on('did-fail-load', (_e, code, _d, url, isMain) => {
    if (isMain && code !== -3) win.loadFile(path.join(__dirname, 'offline.html'));
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(URL_) || url.startsWith('blob:')) return { action: 'allow' };
    shell.openExternal(url); return { action: 'deny' };
  });
}
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());

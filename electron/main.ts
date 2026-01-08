import { app, BrowserWindow, Menu, protocol, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Le serveur Vite en développement, ou le build en production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;

/**
 * Obtient le chemin de base de l'application
 * En production packagée, app.getAppPath() retourne le chemin vers app.asar
 * En développement, on utilise le chemin relatif depuis __dirname
 */
function getAppBasePath(): string {
  if (app.isPackaged) {
    // En production packagée, app.getAppPath() retourne le chemin vers app.asar
    // Par exemple: C:/Users/.../resources/app.asar
    // Tous les fichiers (dist, dist-electron) sont directement dans app.asar
    return app.getAppPath();
  }
  // En développement, remonter de dist-electron/main vers la racine du projet
  return path.resolve(__dirname, '../..');
}

/**
 * Enregistre un protocole personnalisé pour servir les fichiers statiques depuis public/
 * Cela permet d'accéder aux fichiers comme /models/face-api/ et /cadres/ dans Electron
 */
function registerStaticProtocol(): void {
  protocol.registerFileProtocol('app', (request, callback) => {
    try {
      const appBasePath = getAppBasePath();
      const url = request.url.replace('app://', '');
      
      // En production, les fichiers public/ sont copiés dans dist/
      // En développement, ils sont dans public/
      let filePath: string;
      if (app.isPackaged) {
        // En production : depuis dist/ (où Vite copie public/)
        filePath = path.join(appBasePath, 'dist', url);
      } else {
        // En développement : depuis public/
        filePath = path.join(appBasePath, 'public', url);
      }
      
      // Normaliser le chemin pour éviter les problèmes de sécurité
      const normalizedPath = path.normalize(filePath);
      
      // Vérifier que le fichier existe
      if (existsSync(normalizedPath)) {
        callback({ path: normalizedPath });
      } else {
        console.error(`File not found: ${normalizedPath}`);
        callback({ error: -6 }); // FILE_NOT_FOUND
      }
    } catch (error) {
      console.error('Error in registerStaticProtocol:', error);
      callback({ error: -2 }); // FAILED
    }
  });
}

/**
 * Crée la fenêtre principale de l'application
 */
function createWindow(): void {
  const appBasePath = getAppBasePath();
  
  // Chemin du preload script
  let preloadPath: string;
  if (app.isPackaged) {
    // En production : depuis la racine de app.asar
    preloadPath = path.join(appBasePath, 'dist-electron/preload/preload.js');
  } else {
    // En développement : depuis dist-electron/preload
    preloadPath = path.join(__dirname, '../preload/preload.js');
  }

  // Chemin de l'icône
  let iconPath: string;
  if (app.isPackaged) {
    // En production : depuis la racine de app.asar
    iconPath = path.join(appBasePath, 'build/icon-256.png');
  } else {
    // En développement : depuis la racine du projet
    iconPath = path.join(appBasePath, 'build/icon-256.png');
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    icon: existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    titleBarStyle: 'default',
    show: false, // Ne pas afficher jusqu'à ce que le contenu soit chargé
  });

  // Afficher la fenêtre une fois le contenu chargé
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Ouvrir les DevTools en mode développement
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // Charger l'application avec le paramètre mode=admin pour ouvrir directement la page de login
  if (isDev && VITE_DEV_SERVER_URL) {
    // Mode développement : charger depuis le serveur Vite avec paramètre mode=admin
    const urlWithMode = VITE_DEV_SERVER_URL.includes('?') 
      ? `${VITE_DEV_SERVER_URL}&mode=admin` 
      : `${VITE_DEV_SERVER_URL}?mode=admin`;
    mainWindow.loadURL(urlWithMode);
  } else {
    // Mode production : charger depuis le build avec paramètre mode=admin
    // Le fichier index.html est dans dist/ à la racine de app.asar
    const indexPath = path.join(appBasePath, 'dist', 'index.html');
    
    // Logs pour déboguer (à retirer en production finale)
    if (app.isPackaged) {
      console.log('Production mode - Loading index.html');
      console.log('App base path:', appBasePath);
      console.log('Index path:', indexPath);
      console.log('File exists:', existsSync(indexPath));
    }
    
    // Utiliser loadURL avec file:// pour pouvoir ajouter des paramètres de requête
    // Normaliser le chemin pour Windows (remplacer les backslashes par des slashes)
    const normalizedPath = indexPath.replace(/\\/g, '/');
    const fileUrl = `file:///${normalizedPath}?mode=admin`;
    mainWindow.loadURL(fileUrl).catch((error) => {
      console.error('Error loading index.html:', error);
      console.error('Tried path:', indexPath);
      console.error('File URL:', fileUrl);
      console.error('App base path:', appBasePath);
      console.error('__dirname:', __dirname);
      console.error('App path:', app.getAppPath());
    });
  }

  // Gérer la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Crée le menu de l'application
 */
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Quitter',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Recharger',
          accelerator: 'Ctrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          },
        },
        {
          label: 'Plein écran',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
          },
        },
        {
          label: 'Outils de développement',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools();
            }
          },
        },
      ],
    },
  ];

  // Menu spécifique macOS
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Enregistrer le schéma de protocole personnalisé avant que l'app soit prête
// Cela permet d'utiliser le protocole 'app://' pour servir les fichiers statiques
if (!app.isReady()) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ]);
}

// Cette méthode sera appelée quand Electron aura fini de s'initialiser
app.whenReady().then(() => {
  // Enregistrer le protocole personnalisé avant de créer la fenêtre
  registerStaticProtocol();
  createWindow();
  createMenu();

  // Sur macOS, recréer une fenêtre quand l'icône du dock est cliquée
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Gérer la fermeture de l'application depuis le renderer
  ipcMain.handle('app:close', () => {
    app.quit();
  });
});

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Gérer les erreurs de sécurité
app.on('web-contents-created', (_, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    // Optionnel : ouvrir dans le navigateur externe
    // require('electron').shell.openExternal(navigationURL);
  });
});


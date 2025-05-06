const { app, BrowserWindow, BrowserView, session, Menu } = require("electron");
const path = require("path");

let mainWindow;
let tabs = [];
let currentTabIndex = 0;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: false,
        }
    });

    // Load custom AskJeeva homepage
    mainWindow.loadFile(path.join(__dirname, "public", "index.html"));

    // Ad Blocker (Basic)
    session.defaultSession.webRequest.onBeforeRequest(
        { urls: ["*://*.ads.com/*", "*://*.trackers.com/*"] }, 
        (details, callback) => {
            callback({ cancel: true });
        }
    );

    // Add a basic menu with tab options
    const menu = Menu.buildFromTemplate([
        {
            label: "Tabs",
            submenu: [
                { label: "New Tab", click: () => createNewTab("https://www.google.com") },
                { label: "Close Tab", click: () => closeCurrentTab() },
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);
}

function createNewTab(url) {
    let tabView = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    mainWindow.setBrowserView(tabView);
    tabView.setBounds({ x: 0, y: 50, width: 1400, height: 850 });
    tabView.webContents.loadURL(url);

    tabs.push(tabView);
    currentTabIndex = tabs.length - 1;
}

function closeCurrentTab() {
    if (tabs.length > 1) {
        tabs[currentTabIndex].destroy();
        tabs.splice(currentTabIndex, 1);
        currentTabIndex = Math.max(0, currentTabIndex - 1);
        mainWindow.setBrowserView(tabs[currentTabIndex]);
    } else {
        app.quit();
    }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

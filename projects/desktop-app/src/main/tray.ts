import { getAppConfig } from "./helpers/config";
import { getOrCreateMainWindow } from "./windows";
import { Menu, Tray, app, nativeImage } from "electron";
import { join } from "path";

export function setupTray() {
  const icon = join(__dirname, "../../assets/icons", "bitsky16.png");
  const trayIcon = nativeImage.createFromPath(icon);
  const tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Search",
      click: async () => {
        const appConfig = await getAppConfig();
        const mainWindow = getOrCreateMainWindow();
        mainWindow.loadURL(
          `http://${appConfig.WEB_APP_HOST_NAME}:${appConfig.WEB_APP_PORT}`,
        );
        app.dock.show();
      },
    },
    {
      label: "Dashboard",
      click: async () => {
        // const appConfig = await getAppConfig();
        await getOrCreateMainWindow();
        app.dock.show();
      },
    },
    {
      label: "Quit",
      click: () => {
        app.quit(); // actually quit the app.
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip("SeekBot is running in the background");

  return tray;
}

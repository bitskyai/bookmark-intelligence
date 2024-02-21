export enum IpcEvents {
  CLOSE_SETTINGS = "CLOSE_SETTINGS",
  OPEN_SETTINGS = "OPEN_SETTINGS",
  SYNC_GET_APP_CONFIG = "SYNC_GET_APP_CONFIG",
  SYNC_UPDATE_PREFERENCES_JSON = "SYNC_UPDATE_PREFERENCES_JSON",
  SYNC_OPEN_SEARCH_WINDOW = "SYNC_OPEN_SEARCH_WINDOW",
  SYNC_GET_EXTENSIONS = "SYNC_GET_EXTENSIONS",
  EXTENSION_CONNECTED = "EXTENSION_CONNECTED",
  SYNC_REMOVE_EXTENSION = "SYNC_REMOVE_EXTENSION",
}

// message send to main
export const ipcMainEvents = [
  IpcEvents.OPEN_SETTINGS,
  IpcEvents.CLOSE_SETTINGS,
  IpcEvents.SYNC_GET_APP_CONFIG,
  IpcEvents.SYNC_UPDATE_PREFERENCES_JSON,
  IpcEvents.SYNC_OPEN_SEARCH_WINDOW,
  IpcEvents.SYNC_GET_EXTENSIONS,
  IpcEvents.SYNC_REMOVE_EXTENSION,
];

// message send to renderer
export const ipcRendererEvents = [
  IpcEvents.OPEN_SETTINGS,
  IpcEvents.CLOSE_SETTINGS,
  IpcEvents.SYNC_GET_APP_CONFIG,
  IpcEvents.SYNC_UPDATE_PREFERENCES_JSON,
  IpcEvents.EXTENSION_CONNECTED,
];

export const WEBCONTENTS_READY_FOR_IPC_SIGNAL =
  "WEBCONTENTS_READY_FOR_IPC_SIGNAL";

export type EventResponse = {
  status: boolean;
  payload?: any;
  error?: unknown;
};

export type EventRequest = {
  subject: string;
  payload?: unknown;
};

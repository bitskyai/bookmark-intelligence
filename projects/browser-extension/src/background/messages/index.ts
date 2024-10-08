import { LogFormat } from "~helpers/LogFormat"

const logFormat = new LogFormat("messages")

export enum MessageSubject {
  createOrUpdatePages = "createOrUpdatePages",
  startImportBookmarks = "startImportBookmarks",
  stopImportBookmarks = "stopImportBookmarks",
  cleanImportBookmarks = "cleanImportBookmarks",
  startImportHistory = "startImportHistory",
  stopImportHistory = "stopImportHistory",
  cleanImportHistory = "cleanImportHistory",
  captureVisibleTab = "captureVisibleTab",
  getIgnoreURLs = "getIgnoreURLs",
  deleteIgnoreURLs = "deleteIgnoreURLs",
  whetherIgnore = "whetherIgnore"
}

export const init = async () => {
  console.info(...logFormat.formatArgs("init"))
  console.debug(
    ...logFormat.formatArgs("init -> support messages: ", MessageSubject)
  )
}

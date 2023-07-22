import { LogFormat } from "~helpers/LogFormat"

const logFormat = new LogFormat("messages")

export enum MessageSubject {
  createBookmarks = "createBookmarks",
  getBookmarks = "getBookmarks",
  startImportBookmarks = "startImportBookmarks",
  stopImportBookmarks = "stopImportBookmarks",
  cleanImportBookmarks = "cleanImportBookmarks",
  startImportHistory = "startImportHistory",
  stopImportHistory = "stopImportHistory",
  cleanImportHistory = "cleanImportHistory"
}
export type { BookmarksMsgRes } from "./getBookmarks"
export type { BookmarksImportStatusMsgRes } from "./getBookmarksImportStatus"

export const init = async () => {
  console.info(...logFormat.formatArgs("init"))
  console.debug(...logFormat.formatArgs("init -> support messages: ", MessageSubject))
}

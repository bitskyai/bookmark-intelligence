import { LogFormat } from "~helpers/LogFormat"
import {
  prepareStartImportBookmarks,
  startImportBookmarks,
  stopImportBookmarks,
  updateImportBookmarks,
  updateImportBookmarksSummary
} from "~storage"
import { ImportStatus } from "~types"

import { type PageData } from "../fetchPage"
import ImportThread from "./ImportThread"

export class ImportProcess {
  static MAX_CONCURRENT = 20
  static DEFAULT_TIMEOUT = 1000 * 60 * 60 * 2
  private initialized = false
  private stopped = true

  protected importThreads: ImportThread[] = []
  protected jobIndex = 0
  protected logFormat = new LogFormat("modules/imports/ImportProcess")

  concurrent = 10
  timeout: number = ImportProcess.DEFAULT_TIMEOUT

  constructor({
    concurrent,
    timeout
  }: {
    concurrent?: number
    timeout?: number
  }) {
    console.debug(
      ...this.logFormat.formatArgs("constructor", { concurrent, timeout })
    )

    if (concurrent) {
      this.concurrent =
        concurrent <= ImportProcess.MAX_CONCURRENT
          ? concurrent
          : ImportProcess.MAX_CONCURRENT
    }
    if (timeout) {
      this.timeout = timeout
    }
    this.init()
    console.info(...this.logFormat.formatArgs("constructor finished"))
  }

  // by default ImportProcess will import bookmarks
  // if you want to extend it to import other types of data, you need override this method
  // this method should prepare local storage to change importing pages status to ready, and put to in progress to remaining pages
  async prepare() {
    await prepareStartImportBookmarks({ syncUpBookmarks: true })
  }

  // by default ImportProcess will import bookmarks
  // if you want to extend it to import other types of data, you need override this method
  // this method should return an array of PageData that need to fetch content, if url is empty then it will skip this page
  async getImportPages(): Promise<PageData[]> {
    return await startImportBookmarks({
      concurrentBookmarks: this.concurrent
    })
  }

  // by default ImportProcess will import bookmarks
  // if you want to extend it to import other types of data, you need override this method
  // this method should update local storage with the pagesData(if it can get html based on url, then it will have html, otherwise it will have error or warning)
  async updateImportPages(pagesData: PageData[]) {
    await updateImportBookmarks(pagesData)
  }

  // by default ImportProcess will import bookmarks
  // if you want to extend it to import other types of data, you need override this method
  // this method should update local storage to change importing pages status to ready, and put to remaining pages
  async stopImportPages() {
    await stopImportBookmarks()
  }

  async init() {
    console.debug(...this.logFormat.formatArgs("init"))
    this.initialized = false
    await this.prepare()
    this.initialized = true
    console.info(...this.logFormat.formatArgs("init finished"))
  }

  async start() {
    console.info(...this.logFormat.formatArgs("start"))
    if (!this.initialized) {
      await this.init()
    }
    this.stopped = false
    let inProgressPages = await this.getImportPages()
    while (!this.stopped && inProgressPages.length > 0) {
      // reset
      this.importThreads = []

      this.jobIndex++
      console.debug(
        ...this.logFormat.formatArgs(
          `jobIndex: ${this.jobIndex}, inProgressPages:`,
          inProgressPages
        )
      )
      for (let i = 0; i < inProgressPages.length; i++) {
        const page = inProgressPages[i]
        if (!page.url) continue

        const importThread = new ImportThread({
          url: page.url,
          timeout: this.timeout
        })
        this.importThreads.push(importThread)
      }

      const pagesData = await Promise.all(
        this.importThreads.map((thread) => thread.start())
      )
      console.debug(
        ...this.logFormat.formatArgs(
          `jobIndex: ${this.jobIndex}, pagesData:`,
          pagesData
        )
      )

      await this.updateImportPages(pagesData)
      // fetch next
      inProgressPages = await this.getImportPages()
    }

    // await updateImportBookmarksSummary({ status: ImportStatus.Ready })
    this.stopped = true
  }

  async stop() {
    this.stopped = true
    await Promise.all(this.importThreads.map((thread) => thread.stop()))
    await this.stopImportPages()
    return true
  }
}

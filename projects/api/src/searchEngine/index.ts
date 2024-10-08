import { getAppConfig } from "../helpers/config";
import getLogger from "../helpers/logger";
import { type SearchEngineOptions } from "../types";
import {
  HEALTH_CHECK_INTERVAL,
  MAX_TRIES_UNTIL_HEALTH,
  MEILI_SEARCH_BINARY_NAME_PREFIX,
  PAGES_INDEX_NAME,
} from "./constants";
import { getChangedPages, getPagesByIds } from "./pages";
import { getPageIndex, pageIndexSettings, updatePageIndex } from "./pagesIndex";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import fs from "fs-extra";
import { MeiliSearch, type Index } from "meilisearch";
import { join } from "path";

export {
  CHECK_NEW_INDEXES_INTERVAL,
  HEALTH_CHECK_INTERVAL,
  MAX_TRIES_UNTIL_HEALTH,
  MEILI_SEARCH_BINARY_NAME_PREFIX,
  PAGES_INDEX_NAME,
} from "./constants";

let meiliSearchProcess: ChildProcessWithoutNullStreams;
let indexingIntervalHandler: NodeJS.Timer;

export { setupProxy } from "./setupProxy";

async function getMeiliSearchBinaryName(dirPath: string) {
  const dirContents = await fs.readdirSync(dirPath);
  console.log(dirContents);
  const meiliSearchBinaryName = dirContents.find((item) =>
    item.includes(MEILI_SEARCH_BINARY_NAME_PREFIX),
  );
  return meiliSearchBinaryName;
}

async function getMeiliSearchBinaryPathInSource() {
  const logger = getLogger();
  const config = getAppConfig();
  const latestMeiliSearchBinaryName =
    (await getMeiliSearchBinaryName(
      join(config.WEB_APP_SOURCE_ROOT_PATH, "./src/searchEngine"),
    )) ?? MEILI_SEARCH_BINARY_NAME_PREFIX;
  const latestMeiliSearchBinaryPath = join(
    config.WEB_APP_SOURCE_ROOT_PATH,
    "./src/searchEngine",
    latestMeiliSearchBinaryName,
  );
  logger.info(`latestMeiliSearchBinaryPath: ${latestMeiliSearchBinaryPath}`);
  return latestMeiliSearchBinaryPath;
}

async function initPagesIndex() {
  const logger = getLogger();
  const meiliSearch = await getMeiliSearchClient();
  logger.info(`Creating index ${PAGES_INDEX_NAME}`);
  await meiliSearch.createIndex(PAGES_INDEX_NAME, { primaryKey: "id" });
}

async function updatePagesIndexSetting() {
  const logger = getLogger();
  const pageIndexingRecord = await getPageIndex();
  const currentVersion = pageIndexingRecord?.version;
  if (currentVersion !== pageIndexSettings.version) {
    const meiliSearch = await getMeiliSearchClient();
    logger.info(`Updating index ${PAGES_INDEX_NAME} settings`);
    await meiliSearch
      .index(PAGES_INDEX_NAME)
      .updateSettings(pageIndexSettings.settings);
    await updatePageIndex({ version: pageIndexSettings.version });
  } else {
    logger.info(`Index ${PAGES_INDEX_NAME} settings are up to date`);
  }
}

export async function startSearchEngine(serverOptions?: SearchEngineOptions) {
  try {
    const config = getAppConfig(serverOptions ?? {});
    const logger = getLogger();

    const meiliSearchDBPath = config.SEARCH_ENGINE_HOME_PATH;

    const meiliSearchBinaryPath = await getMeiliSearchBinaryPathInSource();
    logger.info(`meiliSearchBinaryPath: ${meiliSearchBinaryPath}`);
    logger.info(`meiliSearchDBPath: ${meiliSearchDBPath}`);
    if (meiliSearchProcess) {
      meiliSearchProcess.kill();
    }
    meiliSearchProcess = spawn(
      meiliSearchBinaryPath,
      [
        "--http-addr",
        `${config.SEARCH_ENGINE_HOST_NAME}:${config.SEARCH_ENGINE_PORT}`,
        "--master-key",
        config.SEARCH_ENGINE_MASTER_KEY,
        "--max-indexing-memory",
        config.SEARCH_ENGINE_MAX_INDEXING_MEMORY.toString(),
        "--max-indexing-threads",
        config.SEARCH_ENGINE_MAX_INDEXING_THREADS.toString(),
        "--db-path",
        meiliSearchDBPath,
        "--no-analytics",
      ],
      { cwd: config.WEB_APP_HOME_PATH },
    );
    meiliSearchProcess.stdout.on("data", (data) => {
      logger.info(`meilisearch stdout`, { data: data.toString() });
    });

    meiliSearchProcess.stderr.on("data", (data) => {
      logger.info(`meilisearch stderr`, { data: data.toString() });
    });

    meiliSearchProcess.on("close", (code) => {
      logger.info(`meilisearch process exited with code ${code}`);
    });

    meiliSearchProcess.on("exit", (code) => {
      logger.info(`meilisearch process exited with code ${code}`);
      if (code !== 0) {
        meiliSearchProcess.kill();
      }
    });

    startIndexing();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function setupIndexes() {
  const logger = getLogger();
  const ready = await waitMeiliSearchReady();
  if (ready) {
    const meiliSearch = await getMeiliSearchClient();
    const indexes = await meiliSearch.getIndexes();
    logger.debug(`existing indexes`, { indexes: indexes });
    const indexesHashMap: { [key: string]: Index } = {};
    indexes.results.map((index) => {
      indexesHashMap[index.uid] = index;
    });
    logger.debug(`existing indexes hashmap`, { hashmap: indexesHashMap });
    if (!indexesHashMap[PAGES_INDEX_NAME]) {
      await initPagesIndex();
    }
    await updatePagesIndexSetting();
  } else {
    logger.error(`MeiliSearch is not ready`);
  }
}

export async function startIndexing() {
  const appConfig = getAppConfig();
  await setupIndexes();
  console.log("startIndexing");
  await startPagesIndex();
  clearInterval(indexingIntervalHandler);
  indexingIntervalHandler = setInterval(async () => {
    await startPagesIndex();
  }, appConfig.SEARCH_ENGINE_INDEXING_FREQUENCY);
}

export async function stopSearchEngine() {
  clearInterval(indexingIntervalHandler);
  if (meiliSearchProcess) {
    meiliSearchProcess.kill();
  }
}

export async function getMeiliSearchClient() {
  const config = getAppConfig();
  const meiliSearch = new MeiliSearch({
    host: `${config.SEARCH_ENGINE_HOST_NAME}:${config.SEARCH_ENGINE_PORT}`,
    apiKey: config.SEARCH_ENGINE_MASTER_KEY,
  });
  return meiliSearch;
}

export async function waitMeiliSearchReady() {
  const logger = getLogger();
  let healthCheck = false;
  let tried = 0;
  while (!healthCheck && tried++ < MAX_TRIES_UNTIL_HEALTH) {
    logger.debug(`healthCheck number: ${tried}`);
    try {
      const meiliSearch = await getMeiliSearchClient();
      const health = await meiliSearch.health();
      if (health.status === "available") {
        healthCheck = true;
      } else {
        await new Promise((resolve) =>
          setTimeout(resolve, HEALTH_CHECK_INTERVAL),
        );
      }
    } catch (err) {
      await new Promise((resolve) =>
        setTimeout(resolve, HEALTH_CHECK_INTERVAL),
      );
    }
  }
  return healthCheck;
}

/**
 * start pages index
 * @param lastIndexAt: specific date to start indexing from
 */
export async function startPagesIndex(lastIndexAt?: Date) {
  const logger = getLogger();
  const pageIndexingRecord = await getPageIndex();
  if (!lastIndexAt) {
    lastIndexAt = pageIndexingRecord?.lastIndexAt ?? new Date(0);
  }
  const pages = await getChangedPages(lastIndexAt);
  const meiliSearch = await getMeiliSearchClient();
  if (pages.length) {
    const indexRes = await meiliSearch
      .index(PAGES_INDEX_NAME)
      .addDocuments(pages, { primaryKey: "id" });
    logger.debug(`indexRes`, { indexRes });

    logger.info("pagesIndex success", {
      lastIndexAt: lastIndexAt,
      pageIndexingRecord: pages.length,
    });
  }
  await updatePageIndex({ lastIndexAt: new Date() });
}

export async function waitUtilPagesIndexFinish() {
  const logger = getLogger();
  const meiliSearch = await getMeiliSearchClient();
  await new Promise((resolve) => {
    const pagesIndexStatsHandler = setInterval(async () => {
      const pagesIndexStats = await meiliSearch
        .index(PAGES_INDEX_NAME)
        .getStats();
      logger.debug(`pagesIndexStats`, {
        isIndexing: pagesIndexStats.isIndexing,
      });
      if (pagesIndexStats.isIndexing === false) {
        clearInterval(pagesIndexStatsHandler);
        resolve(true);
      }
    }, 200);

    // max index time is 60 seconds
    setTimeout(() => {
      clearInterval(pagesIndexStatsHandler);
      resolve(true);
    }, 1000 * 60);
  });
}

export async function removeDocumentsFromPagesIndexByIds(ids: string[]) {
  const logger = getLogger();
  const meiliSearch = await getMeiliSearchClient();
  const indexRes = await meiliSearch
    .index(PAGES_INDEX_NAME)
    .deleteDocuments(ids);
  logger.debug(`indexRes`, { indexRes });
  await waitUtilPagesIndexFinish();
  return true;
}

export async function addDocumentsToPagesIndexByIds(ids: string[]) {
  const logger = getLogger();
  const meiliSearch = await getMeiliSearchClient();
  const pages = await getPagesByIds(ids);
  if (pages.length) {
    const indexRes = await meiliSearch
      .index(PAGES_INDEX_NAME)
      .addDocuments(pages, { primaryKey: "id" });
    logger.debug(`indexRes`, { indexRes });
    await waitUtilPagesIndexFinish();
  }
  // since we didn't updatePageIndex, so this maybe cause duplicate indexing, but it's ok since it doesn't have a huge number
  return true;
}

// export async function stopIndexingPages() {}

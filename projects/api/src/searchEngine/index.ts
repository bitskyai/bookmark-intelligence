import { getPrismaClient } from "../db";
import { overwriteAppConfig, getAppConfig } from "../helpers/config";
import getLogger from "../helpers/logger";
import { type MeiliSearchConfig } from "../types";
import { getChangedPages } from "./pages";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import fs from "fs-extra";
import { MeiliSearch, type Settings, type Index } from "meilisearch";
import { join } from "path";

const MEILI_SEARCH_BINARY_NAME_PREFIX = "meilisearch_bin";
let meiliSearchProcess: ChildProcessWithoutNullStreams;
let indexingIntervalHandler: NodeJS.Timer;

export const PAGES_INDEX_NAME = "pages";
export const TAGS_INDEX_NAME = "tags";
export const MAX_TRIES_UNTIL_HEALTH = 60;
export const HEALTH_CHECK_INTERVAL = 1000;
export const CHECK_NEW_INDEXES_INTERVAL = 1000 * 60 * 5; // 5 min
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
      join(config.APP_SOURCE_PATH, "./src/searchEngine"),
    )) ?? MEILI_SEARCH_BINARY_NAME_PREFIX;
  const latestMeiliSearchBinaryPath = join(
    config.APP_SOURCE_PATH,
    "./src/searchEngine",
    latestMeiliSearchBinaryName,
  );
  logger.info(`latestMeiliSearchBinaryPath: ${latestMeiliSearchBinaryPath}`);
  return latestMeiliSearchBinaryPath;
}

export async function startSearchEngine(serverOptions?: MeiliSearchConfig) {
  try {
    const logger = getLogger();
    const config = overwriteAppConfig(serverOptions ?? {});

    const meiliSearchDBPath = join(
      config.APP_HOME_PATH,
      config.MEILISEARCH_DB_FOLDER,
    );

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
        `${config.HOST_NAME}:${config.MEILISEARCH_PORT}`,
        "--master-key",
        config.MEILISEARCH_MASTER_KEY,
        "--db-path",
        meiliSearchDBPath,
        "--no-analytics",
      ],
      { cwd: config.APP_HOME_PATH },
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
  } else {
    logger.error(`MeiliSearch is not ready`);
  }
}

export async function startIndexing() {
  await setupIndexes();
  console.log("startIndexing");
  clearInterval(indexingIntervalHandler);
  indexingIntervalHandler = setInterval(async () => {
    await startPagesIndex();
  }, CHECK_NEW_INDEXES_INTERVAL);
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
    host: `${config.HOST_NAME}:${config.MEILISEARCH_PORT}`,
    apiKey: config.MEILISEARCH_MASTER_KEY,
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

async function initPagesIndex() {
  const logger = getLogger();
  const meiliSearch = await getMeiliSearchClient();
  logger.info(`Creating index ${PAGES_INDEX_NAME}`);
  await meiliSearch.createIndex(PAGES_INDEX_NAME, { primaryKey: "id" });
  // TODO: need to redesign a way how to update settings
  // Currently, settings are updated only when index is created, it should be more dynamic
  await updatePagesIndexSetting();
}

async function updatePagesIndexSetting() {
  const logger = getLogger();
  const meiliSearch = await getMeiliSearchClient();
  const settings: Settings = {
    distinctAttribute: "url",
    rankingRules: [
      "words",
      "sort",
      "typo",
      "proximity",
      "attribute",
      "exactness",
    ],
    filterableAttributes: [
      "pageTags.tag.name",
      "pageMetadata.bookmarked",
      "pageMetadata.favorite",
      "pageMetadata.incognito",
      "pageMetadata.localMode",
      "pageMetadata.lastVisitTime",
      "url",
    ],
    searchableAttributes: [
      "pageMetadata.displayTitle",
      "pageMetadata.displayDescription",
      "pageTags.tag.name",
      "url",
      "title",
      "description",
      "content",
    ],
    sortableAttributes: [
      "pageMetadata.lastVisitTime",
      "pageMetadata.visitCount",
      "pageMetadata.favorite",
      "pageMetadata.bookmarked",
      "pageMetadata.typeCount",
      "pageMetadata.updatedAt",
    ],
  };
  logger.info(`Updating index ${PAGES_INDEX_NAME} settings`);
  await meiliSearch.index(PAGES_INDEX_NAME).updateSettings(settings);
}

/**
 * start pages index
 * @param lastIndexAt: specific date to start indexing from
 */
async function startPagesIndex(lastIndexAt?: Date) {
  const logger = getLogger();
  const prismaClient = getPrismaClient();
  const config = getAppConfig();
  const pageIndexingRecord = await prismaClient.searchEngineIndex.findFirst({
    where: {
      indexName: PAGES_INDEX_NAME,
    },
  });
  if (!lastIndexAt) {
    lastIndexAt = pageIndexingRecord?.lastIndexAt ?? new Date(0);
  }

  logger.debug(`startPagesIndex `, {
    pageIndexingRecord: pageIndexingRecord,
  });
  logger.info(`startPagesIndex: lastIndexAt: ${lastIndexAt}`);
  const pages = await getChangedPages(lastIndexAt);
  logger.info(`startPagesIndex: ${pages.length} pages`);
  const meiliSearch = new MeiliSearch({
    host: `${config.HOST_NAME}:${config.MEILISEARCH_PORT}`,
    apiKey: config.MEILISEARCH_MASTER_KEY,
  });
  if (pages.length) {
    const indexRes = await meiliSearch
      .index(PAGES_INDEX_NAME)
      .addDocuments(pages, { primaryKey: "id" });
    logger.debug(`indexRes`, { indexRes });
  }
  await prismaClient.searchEngineIndex.upsert({
    where: {
      indexName: PAGES_INDEX_NAME,
    },
    create: {
      indexName: PAGES_INDEX_NAME,
      lastIndexAt: new Date(),
    },
    update: {
      lastIndexAt: new Date(),
    },
  });
}

// export async function stopIndexingPages() {}

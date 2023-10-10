import {
  DEFAULT_HOST_NAME,
  SCREENSHOT_PREVIEW_CROP_HEIGHT,
  SCREENSHOT_PREVIEW_CROP_WIDTH,
} from "../bitskyLibs/shared";
import { defaultPreference } from "../db/seedData/defaultPreference";
import { AppConfig } from "../types";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require("../../package.json");
const appHomePath = path.join(__dirname, "../../", `.${packageJson.name}`);

export const DEFAULT_APP_CONFIG: AppConfig = {
  APP_HOME_PATH: appHomePath,
  SCREENSHOT_FOLDER: "screenshots", // relative to `APP_HOME_PATH`
  SCREENSHOT_PREVIEW_FOLDER: `preview`, // relative to `SCREENSHOT_FOLDER`
  SCREENSHOT_FULL_SIZE_FOLDER: `full`, // relative to `APP_HOME_PATH`
  SCREENSHOT_PREVIEW_CROP_HEIGHT,
  SCREENSHOT_PREVIEW_CROP_WIDTH,
  SAVE_FULL_SIZE_SCREENSHOT: true,
  APP_SOURCE_PATH: path.join(__dirname, "../../"),
  SAVE_RAW_PAGE: false,
  COMBINED_LOG_FILE_NAME: "combined.log",
  SETUP_DB: true,
  SEED_DB: false,
  DATABASE_PROVIDER: "sqlite",
  DATABASE_URL: `file:${appHomePath}/${packageJson.name}.db`,
  HOST_NAME: DEFAULT_HOST_NAME,
  ERROR_LOG_FILE_NAME: "error.log",
  LOG_FILES_FOLDER: "log", // relative to `APP_HOME_PATH`
  LOG_LEVEL: defaultPreference.logLevel,
  LOG_MAX_SIZE: defaultPreference.logSize,
  NODE_ENV: "development",
  PORT: 46997,
  SERVICE_NAME: packageJson.name,
  START_MEILISEARCH: true,
  MEILISEARCH_PORT: 47700,
  MEILISEARCH_MASTER_KEY: defaultPreference.apiKey,
  MEILISEARCH_DB_FOLDER: "meilisearch",
  MEILI_MAX_INDEXING_MEMORY: 1024 * 1024 * 500, // 500MB
  MEILI_MAX_INDEXING_THREADS: 1,
};

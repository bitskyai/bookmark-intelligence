export interface BaseServiceOptions {
  APP_ROOT_PATH?: string; // root path for the app, default to `home` directory
  NODE_ENV: string;
}

export interface SearchEnginePreferences {
  SEARCH_ENGINE_INDEXING_FREQUENCY?: number; // in seconds, how frequent to index new pages
  SEARCH_ENGINE_MASTER_KEY?: string; // master key to access search engine
}

export interface SearchEngineOptions
  extends SearchEnginePreferences,
    BaseServiceOptions {
  SEARCH_ENGINE_HOME_PATH: string; // `APP_ROOT_PATH/SEARCH_ENGINE_NAME`
  SEARCH_ENGINE_HOST_NAME?: string; // default to `localhost`
  SEARCH_ENGINE_PORT?: number;
  SEARCH_ENGINE_NAME?: string; // default to `search-engine`
  SEARCH_ENGINE_MAX_INDEXING_MEMORY?: number;
  SEARCH_ENGINE_MAX_INDEXING_THREADS?: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SearchEngineConfig extends Required<SearchEngineOptions> {}

export interface WebAppPreferences {
  WEB_APP_LOG_LEVEL?: string;
  WEB_APP_LOG_MAX_SIZE?: number;
  WEB_APP_SAVE_RAW_PAGE?: boolean;
  WEB_APP_MASTER_KEY?: string;
  WEB_APP_SAVE_FULL_SIZE_SCREENSHOT?: boolean;
}

export interface WebAppOptions
  extends SearchEngineOptions,
    WebAppPreferences,
    BaseServiceOptions {
  WEB_APP_PORT?: number;
  WEB_APP_DATABASE_PROVIDER?: string;
  WEB_APP_DATABASE_URL?: string;
  WEB_APP_SOURCE_ROOT_PATH?: string;
  WEB_APP_SCREENSHOT_PREVIEW_CROP_HEIGHT?: number;
  WEB_APP_SCREENSHOT_PREVIEW_CROP_WIDTH?: number;
  WEB_APP_NAME?: string;
  WEB_APP_SCREENSHOT_FOLDER?: string;
  WEB_APP_SCREENSHOT_PREVIEW_FOLDER?: string;
  WEB_APP_SCREENSHOT_FULL_SIZE_FOLDER?: string;
  WEB_APP_LOG_FILES_FOLDER?: string;
  WEB_APP_COMBINED_LOG_FILE_NAME?: string;
  WEB_APP_ERROR_LOG_FILE_NAME?: string;
  WEB_APP_START_SEARCH_ENGINE?: boolean;
  WEB_APP_SETUP_DB?: boolean;
  WEB_APP_SEED_DB?: boolean;
}

export interface WebAppConfig
  extends Required<WebAppOptions>,
    Required<SearchEngineConfig> {
  [key: string]: string | number | boolean | undefined;
  // following are not configurable
  WEB_APP_HOME_PATH: string; // app home path. This is where all data stored
  WEB_APP_SCREENSHOT_PATH: string; // `WEB_APP_HOME_PATH/WEB_APP_SCREENSHOT_FOLDER`
  WEB_APP_SCREENSHOT_PREVIEW_PATH: string; // `WEB_APP_HOME_PATH/WEB_APP_SCREENSHOT_FOLDER/WEB_APP_SCREENSHOT_PREVIEW_FOLDER`
  WEB_APP_SCREENSHOT_FULL_SIZE_PATH: string; // `WEB_APP_HOME_PATH/WEB_APP_SCREENSHOT_FOLDER/WEB_APP_SCREENSHOT_FULL_SIZE_FOLDER`
  WEB_APP_LOG_FILES_PATH: string; // `WEB_APP_HOME_PATH/WEB_APP_LOG_FILES_FOLDER`
  WEB_APP_COMBINED_LOG_FILE_PATH: string; // `WEB_APP_HOME_PATH/WEB_APP_LOG_FILES_FOLDER/WEB_APP_COMBINED_LOG_FILE_NAME`
  WEB_APP_ERROR_LOG_FILE_PATH: string; // `WEB_APP_HOME_PATH/WEB_APP_LOG_FILES_FOLDER/WEB_APP_ERROR_LOG_FILE_NAME`
}

export interface Migration {
  id: string;
  checksum: string;
  finished_at: string;
  migration_name: string;
  logs: string;
  rolled_back_at: string;
  started_at: string;
  applied_steps_count: string;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface GQLContext {
  user: User;
}

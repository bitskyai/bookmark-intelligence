import { overwriteAppConfig } from "../helpers/config";
import { MeiliSearchConfig } from "../types";
import { spawn } from "child_process";
import os from "os";
import { join } from "path";

async function getMeiliSearchPath(appSourcePath: string) {
  const meilisearchPath = "./src/searchEngine/meilisearch";
  if (os.platform() === "win32") {
    return join(appSourcePath, `${meilisearchPath}.exe`);
  } else {
    return join(appSourcePath, `${meilisearchPath}`);
  }
}

export async function startSearchEngine(serverOptions?: MeiliSearchConfig) {
  try {
    const config = overwriteAppConfig(serverOptions ?? {});
    const meiliSearchPath = await getMeiliSearchPath(config.APP_SOURCE_PATH);
    const meiliSearchProcess = spawn(meiliSearchPath, [
      "--http-addr",
      `${config.HOST_NAME}:${config.MEILISEARCH_PORT}`,
      "--master-key",
      config.MEILISEARCH_MASTER_KEY,
      "--db-path",
      config.MEILISEARCH_DB_PATH,
    ]);
    meiliSearchProcess.stdout.on("data", (data) => {
      console.log(`meilisearch stdout: ${data}`);
    });

    meiliSearchProcess.stderr.on("data", (data) => {
      console.error(`meilisearch stderr: ${data}`);
    });

    meiliSearchProcess.on("close", (code) => {
      console.log(`meilisearch process exited with code ${code}`);
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// export async function stopSearchEngine() {}

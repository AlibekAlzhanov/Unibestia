import prompts from "prompts";
import fs from "fs";
import path from "path";
import { execSync, exec } from "child_process";
import chalk from "chalk";
import { EnvManager, EnvLine } from "./utilities/env-manager";

// Path to the backend's environment files
const backendDir = path.resolve(__dirname, "../apps/backend");
const backendEnvLocalPath = path.resolve(backendDir, ".env.local");
const backendEnvPath = path.resolve(backendDir, ".env");
const backendEnvExamplePath = path.resolve(backendDir, ".env.local.example");

const dockerContainerName = "postgres-turbo-template";
const dockerImage = "postgres:17";

const dbDefaults = {
  host: "127.0.0.1",
  port: 5432,
  username: "postgres",
  database: "template_db",
};

type DbCreds = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

function isDockerRunning(): boolean {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    console.warn(
      chalk.yellow(
        "⚠️ Docker does not seem to be running. Please start Docker and try again if you want to use it."
      )
    );
    return false;
  }
}

function execCommand(
  command: string,
  options?: { cwd?: string }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: options?.cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(
            `Command failed: ${command}\n${stderr || error.message || stdout}`
          )
        );
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

async function doesContainerExist(containerName: string): Promise<boolean> {
  const { stdout } = await execCommand(
    `docker ps -a --filter name=^/${containerName}$ --format "{{.Names}}"`
  );
  return stdout.trim() === containerName;
}

async function isContainerRunning(containerName: string): Promise<boolean> {
  const { stdout } = await execCommand(
    `docker ps --filter name=^/${containerName}$ --filter status=running --format "{{.Names}}"`
  );
  return stdout.trim() === containerName;
}

async function startContainer(containerName: string): Promise<void> {
  console.log(
    chalk.yellow(
      `▶️ Container '${containerName}' is stopped. Attempting to start...`
    )
  );
  await execCommand(`docker start ${containerName}`);
  console.log(
    chalk.green(`✅ Container '${containerName}' started successfully.`)
  );
}

function quoteForSingleQuotes(value: string): string {
  return value.replace(/'/g, `'\\''`);
}

async function createContainer(creds: DbCreds): Promise<void> {
  console.log(
    chalk.blue(
      `🚀 Container '${dockerContainerName}' not found. Attempting to create and start...`
    )
  );

  const safePassword = quoteForSingleQuotes(creds.password);

  const dockerRunCommand =
    `docker run -d --name ${dockerContainerName} ` +
    `-p ${creds.port}:5432 ` +
    `-e POSTGRES_PASSWORD='${safePassword}' ` +
    `-e POSTGRES_USER=${creds.username} ` +
    `-e POSTGRES_DB=${creds.database} ` +
    `${dockerImage}`;

  console.log(chalk.gray("   Running Docker command (details hidden)..."));
  await execCommand(dockerRunCommand);

  console.log(
    chalk.green(
      `✅ Container '${dockerContainerName}' created and started successfully.`
    )
  );
}

async function waitForPostgresReady(
  containerName: string,
  username: string,
  timeoutMs = 60_000
): Promise<void> {
  console.log(chalk.blue("⏳ Waiting for PostgreSQL to become ready..."));

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await execCommand(
        `docker exec ${containerName} pg_isready -U ${username} -h 127.0.0.1`
      );
      console.log(chalk.green("✅ PostgreSQL is ready."));
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error(
    `PostgreSQL inside '${containerName}' did not become ready within ${timeoutMs / 1000} seconds.`
  );
}

async function ensureDatabaseExists(
  containerName: string,
  username: string,
  database: string
): Promise<void> {
  console.log(
    chalk.blue(`🔎 Checking if database '${chalk.magenta(database)}' exists...`)
  );

  const escapedDb = database.replace(/'/g, "''");

  const checkQuery = `SELECT 1 FROM pg_database WHERE datname='${escapedDb}';`;

  const { stdout } = await execCommand(
    `docker exec ${containerName} psql -U ${username} -d postgres -tAc "${checkQuery}"`
  );

  if (stdout.trim() === "1") {
    console.log(
      chalk.green(`✅ Database '${chalk.magenta(database)}' already exists.`)
    );
    return;
  }

  console.log(
    chalk.yellow(
      `🛠️ Database '${chalk.magenta(database)}' not found. Creating it now...`
    )
  );

  await execCommand(
    `docker exec ${containerName} psql -U ${username} -d postgres -c "CREATE DATABASE \\"${database}\\";"`
  );

  console.log(
    chalk.green(`✅ Database '${chalk.magenta(database)}' created successfully.`)
  );
}

async function ensureExtensions(
  containerName: string,
  username: string,
  database: string
): Promise<void> {
  console.log(
    chalk.blue(
      `🔧 Ensuring required extensions exist in '${chalk.magenta(database)}'...`
    )
  );

  await execCommand(
    `docker exec ${containerName} psql -U ${username} -d ${database} -c "CREATE EXTENSION IF NOT EXISTS \\"uuid-ossp\\";"`
  );

  await execCommand(
    `docker exec ${containerName} psql -U ${username} -d ${database} -c "CREATE EXTENSION IF NOT EXISTS citext;"`
  );

  console.log(chalk.green("✅ Extensions ensured: uuid-ossp, citext"));
}

async function checkAndManageDockerContainer(creds: DbCreds): Promise<boolean> {
  try {
    console.log(
      chalk.blue(`🔍 Checking for Docker container '${dockerContainerName}'...`)
    );

    const containerExists = await doesContainerExist(dockerContainerName);

    if (containerExists) {
      console.log(
        chalk.green(`✔️ Container '${dockerContainerName}' exists.`)
      );

      const running = await isContainerRunning(dockerContainerName);
      if (running) {
        console.log(
          chalk.green(`✔️ Container '${dockerContainerName}' is running.`)
        );
      } else {
        await startContainer(dockerContainerName);
      }
    } else {
      await createContainer(creds);
    }

    await waitForPostgresReady(dockerContainerName, creds.username);
    await ensureDatabaseExists(
      dockerContainerName,
      creds.username,
      creds.database
    );
    await ensureExtensions(
      dockerContainerName,
      creds.username,
      creds.database
    );

    return true;
  } catch (error) {
    console.error(
      chalk.red(`❌ Docker/PostgreSQL setup failed for '${dockerContainerName}':`)
    );
    console.error(error);
    return false;
  }
}

async function setupDatabaseEnv() {
  console.log(chalk.cyan("🚀 Setting up Database environment variables..."));

  let targetEnvPath: string;
  if (fs.existsSync(backendEnvLocalPath)) {
    targetEnvPath = backendEnvLocalPath;
    console.log(
      chalk.green(
        `✅ Using existing backend env file: ${chalk.gray(targetEnvPath)}`
      )
    );
  } else if (fs.existsSync(backendEnvPath)) {
    targetEnvPath = backendEnvPath;
    console.log(
      chalk.green(
        `✅ Using existing backend env file: ${chalk.gray(targetEnvPath)}`
      )
    );
  } else {
    targetEnvPath = backendEnvPath;
    console.log(
      chalk.blue(
        `🔧 No backend .env or .env.local found. Will create ${chalk.gray(targetEnvPath)}.`
      )
    );

    try {
      fs.writeFileSync(targetEnvPath, "", "utf-8");
    } catch (err) {
      console.error(
        chalk.red(
          `❌ Failed to create initial empty env file at ${chalk.gray(targetEnvPath)}:`
        ),
        err
      );
      process.exit(1);
    }
  }

  let defaultLines: EnvLine[] = [];
  try {
    const exampleManager = new EnvManager(backendEnvExamplePath);
    defaultLines = exampleManager.getLines();

    if (defaultLines.length === 0) {
      console.warn(
        chalk.yellow(
          `⚠️ Example env file ${chalk.gray(backendEnvExamplePath)} is empty or not found. Defaults might be missing.`
        )
      );
    } else {
      console.log(
        chalk.blue(
          `ℹ️ Loaded structure from ${chalk.gray(backendEnvExamplePath)}.`
        )
      );
    }
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      console.warn(
        chalk.yellow(
          `⚠️ Could not read or parse ${chalk.gray(backendEnvExamplePath)}. Defaults might be missing. Error: ${err.message}`
        )
      );
    } else {
      console.log(
        chalk.blue(
          `ℹ️ Example env file ${chalk.gray(backendEnvExamplePath)} not found. Proceeding without default structure.`
        )
      );
    }
  }

  const envManager = new EnvManager(targetEnvPath, defaultLines);

  let useDocker = false;
  if (isDockerRunning()) {
    const { manageDocker } = await prompts({
      type: "confirm",
      name: "manageDocker",
      message:
        "Docker seems to be running. Do you want to use Docker to manage the PostgreSQL database (Postgres 17)?",
      initial: true,
    });
    useDocker = manageDocker;
  }

  let dbCreds: DbCreds = { ...dbDefaults, password: "" };

  if (useDocker) {
    const existingPassword = envManager.getValue("DB_PASSWORD");
    const existingUsername = envManager.getValue("DB_USERNAME");
    const existingDatabase = envManager.getValue("DB_DATABASE");
    const existingPortStr = envManager.getValue("DB_PORT");
    const existingPort = existingPortStr
      ? parseInt(existingPortStr, 10)
      : dbDefaults.port;

    const hasExistingDbCreds =
      existingPassword !== undefined &&
      Boolean(existingUsername) &&
      Boolean(existingDatabase);

    if (hasExistingDbCreds) {
      const passDisplay =
        existingPassword === ""
          ? chalk.gray("(no password)")
          : chalk.yellow("********");

      console.log(
        chalk.blue(
          `ℹ️ Found existing database credentials in ${chalk.gray(targetEnvPath)}.`
        )
      );

      const { useExistingCreds } = await prompts({
        type: "confirm",
        name: "useExistingCreds",
        message: `Use existing credentials (User: ${chalk.magenta(existingUsername!)}, DB: ${chalk.magenta(existingDatabase!)}, Port: ${chalk.magenta(existingPort)}, Pass: ${passDisplay}) for Docker container?`,
        initial: true,
      });

      if (useExistingCreds) {
        console.log(
          chalk.green(
            "👍 Using existing database credentials for Docker container."
          )
        );

        dbCreds = {
          host: "127.0.0.1",
          port: existingPort,
          username: existingUsername!,
          password: existingPassword!,
          database: existingDatabase!,
        };
      } else {
        const { dockerPassword } = await prompts({
          type: "password",
          name: "dockerPassword",
          message: `Enter the desired password for the '${chalk.magenta(dbDefaults.username)}' user in the Docker container (leave blank for no password):`,
        });

        dbCreds = {
          host: "127.0.0.1",
          port: dbDefaults.port,
          username: dbDefaults.username,
          password: dockerPassword ?? "",
          database: dbDefaults.database,
        };
      }
    } else {
      console.log(
        chalk.blue(
          `ℹ️ No existing DB credentials found in ${chalk.gray(targetEnvPath)}.`
        )
      );

      const { dockerPassword } = await prompts({
        type: "password",
        name: "dockerPassword",
        message: `Enter the desired password for the default user ('${chalk.magenta(dbDefaults.username)}') in the Docker container (leave blank for no password):`,
      });

      dbCreds = {
        host: "127.0.0.1",
        port: dbDefaults.port,
        username: dbDefaults.username,
        password: dockerPassword ?? "",
        database: dbDefaults.database,
      };
    }

    const dockerReady = await checkAndManageDockerContainer(dbCreds);

    if (dockerReady) {
      console.log(
        chalk.green("✅ Using Docker container credentials for .env file.")
      );
      dbCreds.host = "127.0.0.1";
    } else {
      console.warn(
        chalk.yellow(
          "⚠️ Docker setup failed. Falling back to manual credential input."
        )
      );
      useDocker = false;
    }
  }

  if (!useDocker) {
    console.log(chalk.blue("⚙️ Please provide manual database credentials:"));

    const { host, port, username, password, database } = await prompts([
      {
        type: "text",
        name: "host",
        message: "Enter PostgreSQL Host:",
        initial: envManager.getValue("DB_HOST") || dbDefaults.host,
      },
      {
        type: "number",
        name: "port",
        message: "Enter PostgreSQL Port:",
        initial: parseInt(
          envManager.getValue("DB_PORT") || String(dbDefaults.port),
          10
        ),
      },
      {
        type: "text",
        name: "username",
        message: "Enter PostgreSQL Username:",
        initial: envManager.getValue("DB_USERNAME") || dbDefaults.username,
      },
      {
        type: "password",
        name: "password",
        message: "Enter PostgreSQL Password:",
      },
      {
        type: "text",
        name: "database",
        message: "Enter PostgreSQL Database Name:",
        initial: envManager.getValue("DB_DATABASE") || dbDefaults.database,
      },
    ]);

    if (password === undefined || password === null) {
      console.error(chalk.red("❌ Database password prompt error."));
      process.exit(1);
    }

    dbCreds = {
      host,
      port,
      username,
      password,
      database,
    };
  }

  console.log(
    chalk.blue(
      `📝 Updating database configuration in ${chalk.gray(targetEnvPath)}...`
    )
  );

  envManager
    .setValue("DB_HOST", dbCreds.host)
    .setValue("DB_PORT", String(dbCreds.port))
    .setValue("DB_USERNAME", dbCreds.username)
    .setValue("DB_PASSWORD", dbCreds.password)
    .setValue("DB_DATABASE", dbCreds.database);

  try {
    envManager.save();
    console.log(
      chalk.green(
        `✅ Successfully updated database configuration in ${chalk.gray(targetEnvPath)}`
      )
    );

    if (!useDocker) {
      console.log(
        chalk.yellow(
          "🔑 Please ensure your PostgreSQL server is running, the user exists, and the database exists."
        )
      );
      console.log(
        chalk.yellow(
          `   You might need to run SQL commands like: CREATE DATABASE ${chalk.magenta(dbCreds.database)}; CREATE USER ${chalk.magenta(dbCreds.username)} WITH PASSWORD 'your_password'; GRANT ALL PRIVILEGES ON DATABASE ${chalk.magenta(dbCreds.database)} TO ${chalk.magenta(dbCreds.username)};`
        )
      );
    }
  } catch (error) {
    console.error(
      chalk.red(`❌ Failed to write ${chalk.gray(targetEnvPath)}:`),
      error
    );
    process.exit(1);
  }
}

setupDatabaseEnv().catch((err) => {
  console.error(
    chalk.red("\n💥 An unexpected error occurred during DB setup:"),
    err
  );
  process.exit(1);
});
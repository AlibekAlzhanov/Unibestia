import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { parseArgs } from "node:util";

import {
  AuditLog,
  EducationProgramGroup,
  FavoriteOffer,
  ModerationTask,
  Notification,
  Offer,
  OfferCategory,
  OfferLocation,
  OfferMedia,
  Partner,
  PartnerLocation,
  PartnerMember,
  Redemption,
  ReferralCode,
  ReferralReward,
  Review,
  Role,
  StudentProfile,
  StudentVerification,
  University,
  UniversityEmailDomain,
  User,
  UserRole,
  Wallet,
  WalletTransaction,
} from "./entities/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let envFromArgs: string | undefined;

try {
  const { values } = parseArgs({
    options: {
      env: { type: "string" },
    },
  });

  envFromArgs = values.env as string | undefined;
} catch {
  console.log(
    "Note: Unable to parse command line arguments, falling back to environment variables"
  );
}

const findEnvFile = (): string => {
  if (envFromArgs && fs.existsSync(envFromArgs)) {
    return envFromArgs;
  }

  if (process.env.DB_ENV_PATH && fs.existsSync(process.env.DB_ENV_PATH)) {
    return process.env.DB_ENV_PATH;
  }

  const possiblePaths = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "apps", "backend", ".env.local"),
    path.join(process.cwd(), "..", "apps", "backend", ".env.local"),
    path.join(process.cwd(), "..", "..", "apps", "backend", ".env.local"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "apps", "backend", ".env"),
    path.join(process.cwd(), "..", "apps", "backend", ".env"),
    path.join(process.cwd(), "..", "..", "apps", "backend", ".env"),
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      return envPath;
    }
  }

  return path.join(process.cwd(), "apps", "backend", ".env");
};

const envPath = findEnvFile();
console.log("Loading .env from:", envPath);
config({ path: envPath });

export const entities = [
  User,
  Role,
  UserRole,
  University,
  UniversityEmailDomain,
  EducationProgramGroup,
  StudentProfile,
  StudentVerification,
  Partner,
  PartnerMember,
  PartnerLocation,
  OfferCategory,
  Offer,
  OfferMedia,
  OfferLocation,
  FavoriteOffer,
  Wallet,
  WalletTransaction,
  ReferralCode,
  ReferralReward,
  Redemption,
  Review,
  Notification,
  ModerationTask,
  AuditLog,
];

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "unibestie_db",
  entities: [
    ...entities,
    path.join(__dirname, "entities", "**", "*.entity.{js,ts}"),
  ],
  migrations: [path.join(__dirname, "migrations", "*.{js,ts}")],
  synchronize: false,
  logging: process.env.NODE_ENV !== "production",
};

console.log("Database connection info:", {
  envPath,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  database: process.env.DB_DATABASE,
});

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;

import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { TRPCService } from "@repo/trpc";
import * as os from "os";
import { AppModule } from "./app.module.js";

function parseCorsOrigins(value: string | undefined): string[] {
  const fallbackOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
  ];

  if (!value?.trim()) {
    return fallbackOrigins;
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : fallbackOrigins;
}

function getLocalIpAddress(): string {
  const networkInterfaces = os.networkInterfaces();

  const candidates: string[] = [];

  for (const [name, interfaces] of Object.entries(networkInterfaces)) {
    if (!interfaces) {
      continue;
    }

    const normalizedName = name.toLowerCase();

    const isVirtualAdapter =
      normalizedName.includes("wsl") ||
      normalizedName.includes("hyper-v") ||
      normalizedName.includes("virtual") ||
      normalizedName.includes("vmware") ||
      normalizedName.includes("virtualbox") ||
      normalizedName.includes("docker") ||
      normalizedName.includes("vethernet");

    if (isVirtualAdapter) {
      continue;
    }

    for (const item of interfaces) {
      if (item.family === "IPv4" && !item.internal) {
        candidates.push(item.address);
      }
    }
  }

  const preferredPrivateIp =
    candidates.find((ip) => ip.startsWith("192.168.")) ??
    candidates.find((ip) => ip.startsWith("10.")) ??
    candidates.find((ip) => ip.startsWith("172."));

  return preferredPrivateIp ?? candidates[0] ?? "localhost";
}

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === "production";

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProduction
      ? ["error", "warn"]
      : ["error", "warn", "log", "debug", "verbose"],
    abortOnError: isProduction,
    bufferLogs: true,
  });

  const logger = new Logger("Bootstrap");
  const configService = app.get(ConfigService);

  const nodeEnv = configService.get<string>("NODE_ENV") ?? "development";
  const port = configService.getOrThrow<number>("PORT");
  const corsOrigins = parseCorsOrigins(
    configService.get<string>("CORS_ORIGINS")
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  app.enableCors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  });

  const trpcService = app.get(TRPCService);
  trpcService.applyMiddleware(app);

  await app.listen(port, "0.0.0.0");

  const localIp = getLocalIpAddress();

  logger.log(`Application is running on http://localhost:${port}`);

  if (nodeEnv !== "production") {
    logger.log(`Local network URL: http://${localIp}:${port}`);
    logger.log(`tRPC panel: http://localhost:${port}/panel`);
    logger.log(`Allowed CORS origins: ${corsOrigins.join(", ")}`);
  }
}

bootstrap().catch((error) => {
  Logger.error(
    "Failed to bootstrap application",
    error instanceof Error ? error.stack : String(error)
  );
});
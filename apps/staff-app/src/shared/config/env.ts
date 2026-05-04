import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_TRPC_URL: z.string().url(),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

function readEnv() {
  return {
    EXPO_PUBLIC_API_URL:
      process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001",
    EXPO_PUBLIC_TRPC_URL:
      process.env.EXPO_PUBLIC_TRPC_URL ?? "http://localhost:3001/trpc",
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  };
}

const parsed = envSchema.safeParse(readEnv());

export const env = parsed.success
  ? parsed.data
  : {
      EXPO_PUBLIC_API_URL: "http://localhost:3001",
      EXPO_PUBLIC_TRPC_URL: "http://localhost:3001/trpc",
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
    };

export function getEnvErrorMessage(): string | null {
  if (parsed.success) {
    return null;
  }

  return parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

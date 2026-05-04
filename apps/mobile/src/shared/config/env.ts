import Constants from "expo-constants";
import { z } from "zod";

const extra = Constants.expoConfig?.extra ?? {};

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_TRPC_URL: z.string().url(),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  EXPO_PUBLIC_POSTHOG_KEY: z.string().optional(),
  EXPO_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

const rawEnv = {
  EXPO_PUBLIC_API_URL:
    process.env.EXPO_PUBLIC_API_URL ??
    extra.EXPO_PUBLIC_API_URL ??
    "http://localhost:3001",
  EXPO_PUBLIC_TRPC_URL:
    process.env.EXPO_PUBLIC_TRPC_URL ??
    extra.EXPO_PUBLIC_TRPC_URL ??
    "http://localhost:3001/trpc",
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    extra.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    "",
  EXPO_PUBLIC_POSTHOG_KEY:
    process.env.EXPO_PUBLIC_POSTHOG_KEY ??
    extra.EXPO_PUBLIC_POSTHOG_KEY ??
    "",
  EXPO_PUBLIC_POSTHOG_HOST:
    process.env.EXPO_PUBLIC_POSTHOG_HOST ??
    extra.EXPO_PUBLIC_POSTHOG_HOST ??
    "https://app.posthog.com",
};

const parsedEnv = envSchema.safeParse(rawEnv);

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      EXPO_PUBLIC_API_URL: "http://localhost:3001",
      EXPO_PUBLIC_TRPC_URL: "http://localhost:3001/trpc",
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
      EXPO_PUBLIC_POSTHOG_KEY: "",
      EXPO_PUBLIC_POSTHOG_HOST: "https://app.posthog.com",
    };

export function getEnvErrorMessage(): string | null {
  if (parsedEnv.success) {
    return null;
  }

  return parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}


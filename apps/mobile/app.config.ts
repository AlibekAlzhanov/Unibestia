import type { ConfigContext, ExpoConfig } from "expo/config";

const appName = "UniBestia";
const appSlug = "unibestia-mobile";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: appName,
  slug: appSlug,
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme: "unibestia",
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: "com.alibekalzhanov.unibestia",
    infoPlist: {
      ...config.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    ...config.android,
    package: "com.alibekalzhanov.unibestia",
    adaptiveIcon: {
      backgroundColor: "#F7F6F1",
    },
  },
  web: {
    ...config.web,
    bundler: "metro",
  },
  plugins: ["expo-secure-store"],
  extra: {
    ...config.extra,
    EXPO_PUBLIC_API_URL:
      process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001",
    EXPO_PUBLIC_TRPC_URL:
      process.env.EXPO_PUBLIC_TRPC_URL ?? "http://localhost:3001/trpc",
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
    EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "",
    EXPO_PUBLIC_POSTHOG_HOST:
      process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});

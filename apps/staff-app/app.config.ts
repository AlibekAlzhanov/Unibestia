import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "UniBestia Staff",
  slug: "unibestia-staff",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme: "unibestia-staff",
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: "com.alibekalzhanov.unibestia.staff",
    infoPlist: {
      ...config.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        "Камера нужна сотруднику партнера для сканирования QR-кодов студентов.",
    },
  },
  android: {
    ...config.android,
    package: "com.alibekalzhanov.unibestia.staff",
    adaptiveIcon: {
      backgroundColor: "#F7F6F1",
    },
    permissions: ["CAMERA"],
  },
  web: {
    ...config.web,
    bundler: "metro",
  },
  plugins: [
    "expo-secure-store",
    [
      "expo-camera",
      {
        cameraPermission:
          "Камера нужна сотруднику партнера для сканирования QR-кодов студентов.",
      },
    ],
  ],
});

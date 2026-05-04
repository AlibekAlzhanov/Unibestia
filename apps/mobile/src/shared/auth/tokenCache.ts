import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const memoryCache = new Map<string, string>();

export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return memoryCache.get(key) ?? null;
      }

      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async saveToken(key: string, token: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        memoryCache.set(key, token);
        return;
      }

      await SecureStore.setItemAsync(key, token);
    } catch {
      // Token persistence should never crash the app shell.
    }
  },
};


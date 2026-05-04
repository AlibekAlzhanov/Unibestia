import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

import { RootNavigator } from "./navigation/RootNavigator";
import { RootProviders } from "./providers/RootProviders";
import { getEnvErrorMessage } from "../shared/config/env";
import { colors } from "../shared/theme/colors";
import { ConfigurationErrorScreen } from "../shared/ui/ConfigurationErrorScreen";

export function AppRoot() {
  const envErrorMessage = getEnvErrorMessage();

  if (envErrorMessage) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <ConfigurationErrorScreen message={envErrorMessage} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <RootProviders>
          <RootNavigator />
        </RootProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

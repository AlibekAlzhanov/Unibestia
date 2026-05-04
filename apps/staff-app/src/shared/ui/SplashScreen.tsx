import { StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";
import { AppText } from "./AppText";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <AppText variant="heading" color={colors.primary}>
        UniBestia Staff
      </AppText>
      <AppText color={colors.textSoft} style={styles.subtitle}>
        Загружаем рабочее место сотрудника...
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
  },
});
